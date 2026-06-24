/**
 * fileParser.js
 *
 * Extracts structured transaction data from uploaded files.
 * Files are read from Buffer (Multer MemoryStorage) — never written to disk.
 *
 * Supported:
 *   - Excel (.xlsx, .xls)
 *   - CSV (.csv)
 *   - PDF (.pdf)
 *   - Image (.jpg, .jpeg, .png)
 *
 * Returns: Array of { amount, description, date, type } objects
 * Callers are responsible for mapping categoryId before saving.
 */