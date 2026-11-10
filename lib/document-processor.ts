import pdfParse from 'pdf-parse';

export interface ProcessedDocument {
  title: string;
  content: string;
  pageCount: number;
  pages: { pageNumber: number; content: string }[];
}

export interface TextChunk {
  content: string;
  chunkIndex: number;
  metadata: {
    page_number?: number;
    chapter?: string;
    section?: string;
    document_name: string;
    document_type: string;
    subject_id: string;
  };
}

export interface ChapterHeading {
  title: string;
  startIndex: number;
  endIndex: number;
}

export interface ChunkOptions {
  document_name: string;
  document_type: string;
  subject_id: string;
  chunkSize?: number;
  chunkOverlap?: number;
}

/**
 * Normalizes and cleans raw text extracted from documents.
 * Removes extra whitespace, invalid control characters, fixes encoding artifacts,
 * and standardizes newline characters.
 */
export function cleanText(text: string): string {
  if (!text) return '';

  return (
    text
      // Normalize Unicode characters to standard canonical composition
      .normalize('NFKC')
      // Standardize newlines
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove non-printable control characters except tab and newline
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
      // Replace zero-width spaces, non-breaking spaces, and unusual spaces with standard space
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\u00A0/g, ' ')
      // Collapse multiple horizontal spaces/tabs into a single space
      .replace(/[^\S\n]+/g, ' ')
      // Ensure lines don't have trailing or leading horizontal whitespace
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
      // Collapse 3 or more consecutive newlines into 2 (paragraph break)
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

/**
 * Detects chapter and section headers across document content.
 * Matches patterns like 'Chapter 1', 'Unit 3', 'Module 2', '1.1 Title', etc.
 */
export function detectChapters(content: string): ChapterHeading[] {
  if (!content) return [];

  const headings: { title: string; startIndex: number }[] = [];
  const lines = content.split('\n');
  let currentOffset = 0;

  const chapterPatterns = [
    /^(?:chapter|unit|module|part|section)\s+([0-9ivxlcdm]+(?:[:.\-–—]\s*.*)?)$/i,
    /^(\d+\.\d+(?:\.\d+)?)\s+([A-Z][^\n]{2,80})$/,
    /^([A-Z0-9\s:.\-–—]{4,60})$/,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineStart = currentOffset;
    currentOffset += lines[i].length + 1; // +1 for the newline

    if (!line || line.length < 3 || line.length > 90) continue;

    // Check against patterns
    let isHeading = false;
    let headingTitle = '';

    // Check explicit Chapter/Unit pattern
    const chMatch = line.match(chapterPatterns[0]);
    if (chMatch) {
      isHeading = true;
      headingTitle = line;
    } else {
      // Check numbered sections (e.g., 1.2 Binary Trees)
      const secMatch = line.match(chapterPatterns[1]);
      if (secMatch) {
        isHeading = true;
        headingTitle = line;
      } else if (
        line === line.toUpperCase() &&
        /[A-Z]/.test(line) &&
        line.length >= 4 &&
        line.length <= 50 &&
        !line.includes('...') &&
        !line.includes('PAGE')
      ) {
        // All-caps standalone header line
        isHeading = true;
        headingTitle = line;
      }
    }

    if (isHeading) {
      headings.push({
        title: headingTitle,
        startIndex: lineStart,
      });
    }
  }

  // Calculate endIndex for each detected heading
  return headings.map((h, idx) => ({
    title: h.title,
    startIndex: h.startIndex,
    endIndex: idx < headings.length - 1 ? headings[idx + 1].startIndex : content.length,
  }));
}

/**
 * Extracts and structures text content from a PDF Buffer.
 * Parses individual pages, cleans text, and validates readabilty.
 */
export async function extractPDFContent(
  buffer: Buffer,
  title: string = 'Untitled Document'
): Promise<ProcessedDocument> {
  if (!buffer || buffer.length === 0) {
    throw new Error('PDF file buffer is empty or corrupted');
  }

  const pages: { pageNumber: number; content: string }[] = [];
  let pageCounter = 1;

  const renderOptions = {
    pagerender: async (pageData: any): Promise<string> => {
      try {
        const textContent = await pageData.getTextContent();
        let lastY: number | undefined;
        let pageText = '';

        for (const item of textContent.items) {
          if (lastY === undefined || lastY === item.transform[5]) {
            pageText += item.str;
          } else {
            pageText += '\n' + item.str;
          }
          lastY = item.transform[5];
        }

        const cleaned = cleanText(pageText);
        const pageNumber =
          typeof pageData.pageIndex === 'number'
            ? pageData.pageIndex + 1
            : pageCounter++;

        pages.push({
          pageNumber,
          content: cleaned,
        });

        return pageText;
      } catch {
        // Fallback if getTextContent fails for this individual page
        const fallbackNum = pageCounter++;
        pages.push({ pageNumber: fallbackNum, content: '' });
        return '';
      }
    },
  };

  try {
    const pdfData = await pdfParse(buffer, renderOptions);

    // Fallback if pagerender was not triggered by pdfParse
    if (pages.length === 0 && pdfData.text) {
      const rawPages = pdfData.text.split(/\f/);
      rawPages.forEach((rawPage, index) => {
        const cleaned = cleanText(rawPage);
        pages.push({
          pageNumber: index + 1,
          content: cleaned,
        });
      });
    }

    // Sort pages by pageNumber to guarantee strict order
    pages.sort((a, b) => a.pageNumber - b.pageNumber);

    const fullText = cleanText(
      pdfData.text || pages.map((p) => p.content).join('\n\n')
    );

    if (!fullText || fullText.trim().length === 0) {
      throw new Error(
        'PDF document contains no readable text. It may be image-based, scanned without OCR, or password-protected.'
      );
    }

    return {
      title,
      content: fullText,
      pageCount: pdfData.numpages || pages.length || 1,
      pages: pages.length > 0 ? pages : [{ pageNumber: 1, content: fullText }],
    };
  } catch (err: any) {
    if (err.message?.includes('PDF document contains no readable text')) {
      throw err;
    }
    throw new Error(`Failed to parse PDF document: ${err.message || String(err)}`);
  }
}

/**
 * Extracts and structures text content from plain text (.txt / markdown).
 */
export function extractTextContent(
  content: string,
  title: string = 'Untitled Document'
): ProcessedDocument {
  if (!content || !content.trim()) {
    throw new Error('Text document is empty');
  }

  const cleaned = cleanText(content);
  const pages: { pageNumber: number; content: string }[] = [];

  // Check if content has form-feed page markers
  if (cleaned.includes('\f')) {
    const rawPages = cleaned.split(/\f/);
    rawPages.forEach((p, idx) => {
      const c = p.trim();
      if (c) {
        pages.push({ pageNumber: idx + 1, content: c });
      }
    });
  } else {
    // Break into logical pages of approx 3000 characters respecting paragraphs
    const TARGET_PAGE_CHARS = 3000;
    let cursor = 0;
    let pageNum = 1;

    while (cursor < cleaned.length) {
      let targetEnd = cursor + TARGET_PAGE_CHARS;
      if (targetEnd >= cleaned.length) {
        targetEnd = cleaned.length;
      } else {
        const nextBreak = cleaned.lastIndexOf('\n\n', targetEnd);
        if (nextBreak > cursor + 1500) {
          targetEnd = nextBreak;
        }
      }

      const slice = cleaned.substring(cursor, targetEnd).trim();
      if (slice) {
        pages.push({ pageNumber: pageNum++, content: slice });
      }
      cursor = targetEnd;
    }
  }

  if (pages.length === 0) {
    pages.push({ pageNumber: 1, content: cleaned });
  }

  return {
    title,
    content: cleaned,
    pageCount: pages.length,
    pages,
  };
}

/**
 * Performs smart chunking across document pages with paragraph and sentence preservation.
 * Defaults: Chunk size = 500 chars, Overlap = 100 chars.
 * Preserves page tracking, chapter detection, and metadata attachments.
 */
export function chunkDocument(
  doc: ProcessedDocument,
  options: ChunkOptions
): TextChunk[] {
  const chunkSize = options.chunkSize || 500;
  const chunkOverlap = options.chunkOverlap || 100;

  if (chunkOverlap >= chunkSize) {
    throw new Error('chunkOverlap must be strictly less than chunkSize');
  }

  const chunks: TextChunk[] = [];
  let chunkIndexCounter = 0;

  let activeChapter: string | undefined;
  let activeSection: string | undefined;

  // Process page by page to guarantee accurate page number metadata
  for (const page of doc.pages) {
    const pageText = page.content.trim();
    if (!pageText) continue;

    const lines = pageText.split('\n');

    // Scan page lines to track current chapter / section headings
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (/^(?:chapter|unit|module|part)\s+[\w\d.-]+/i.test(line)) {
        activeChapter = line;
      } else if (/^\d+\.\d+(?:\.\d+)?\s+/i.test(line) || /^section\s+[\w\d.-]+/i.test(line)) {
        activeSection = line;
      }
    }

    let start = 0;
    const textLength = pageText.length;

    while (start < textLength) {
      let end = start + chunkSize;

      if (end >= textLength) {
        end = textLength;
      } else {
        // Try to split on natural boundaries within the last 150 characters of the window
        const lookbackLimit = Math.max(start, end - 150);

        // 1. Try paragraph break (\n\n)
        let splitPos = pageText.lastIndexOf('\n\n', end);
        if (splitPos >= lookbackLimit) {
          end = splitPos + 2;
        } else {
          // 2. Try sentence boundary (. , ? , ! followed by whitespace or newline)
          const sentenceRegex = /[.?!]\s/g;
          let match: RegExpExecArray | null;
          let bestSentenceEnd = -1;

          sentenceRegex.lastIndex = lookbackLimit;
          while ((match = sentenceRegex.exec(pageText)) !== null) {
            if (match.index + 2 <= end) {
              bestSentenceEnd = match.index + 2;
            } else {
              break;
            }
          }

          if (bestSentenceEnd > lookbackLimit) {
            end = bestSentenceEnd;
          } else {
            // 3. Try line break
            const lineBreakPos = pageText.lastIndexOf('\n', end);
            if (lineBreakPos >= lookbackLimit) {
              end = lineBreakPos + 1;
            } else {
              // 4. Try space (word boundary)
              const spacePos = pageText.lastIndexOf(' ', end);
              if (spacePos >= lookbackLimit) {
                end = spacePos + 1;
              }
            }
          }
        }
      }

      const chunkContent = pageText.substring(start, end).trim();

      // Only retain chunks with meaningful content (at least 20 alphanumeric chars)
      if (chunkContent.length >= 20 && /[a-zA-Z0-9]/.test(chunkContent)) {
        chunks.push({
          content: chunkContent,
          chunkIndex: chunkIndexCounter++,
          metadata: {
            page_number: page.pageNumber,
            chapter: activeChapter,
            section: activeSection,
            document_name: options.document_name,
            document_type: options.document_type,
            subject_id: options.subject_id,
          },
        });
      }

      if (end >= textLength) {
        break;
      }

      // Slide start forward by (end - overlap)
      const nextStart = end - chunkOverlap;
      start = nextStart > start ? nextStart : start + 1;
    }
  }

  return chunks;
}
