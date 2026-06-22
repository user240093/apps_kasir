# Implementation Notes

## Source of Truth Priority

When conflicts arose across design documents, the following priority was used:

1. **SRS** (`srs.md`) — Features, business rules, validation, data objects
2. **Information Architecture** (`information_architecture.md`) — Routes, navigation, page structure
3. **Design System** (`design_system.md`) — Colors, typography, components, spacing, responsive
4. **User Flows** (`userflow_uc_*.md`) — Step-by-step interactions
5. **System Logics** (`sys_uc_*.md`) — API contracts, sequence diagrams

## Conflicts & Decisions

### 1. UC-004 "Kategori" Field (User Flow vs SRS)
- **Conflict:** User Flow UC-004 §4 lists "Kategori" as a field in the add-product form. SRS F002 does not include a category field.
- **Decision:** Omitted "Kategori". SRS takes priority.

### 2. Ctrl+C Shortcut (User Flow UC-002 vs Browser Default)
- **Conflict:** User Flow UC-002 §4 specifies Ctrl+C to focus search. This conflicts with the browser's native Copy shortcut.
- **Decision:** Omitted Ctrl+C. Design System §13 specifies F2 for search focus, which is the intended primary shortcut.

### 3. Ctrl+B Shortcut (Design System vs User Flow)
- **Conflict:** Design System §13 lists Ctrl+B for payment dialog. The User Flow UC-002 §4 only mentions F9. The System Logic UC-002 §2.4 also only mentions F9.
- **Decision:** Both F9 and Ctrl+B work. DS §13 is the authoritative source for keyboard shortcuts.

### 4. Sidebar Responsive Breakpoints (Design System vs User Flow)
- **Conflict:** User Flow UC-002 §1 describes a sidebar with icons at 1024px. Design System §12 defines 3 tiers: full at ≥1024px, collapsed at 768-1023px, hidden+hamburger at <768px. Information Architecture §6 specifies collapse at 768px.
- **Decision:** Implemented DS §12 3-tier behavior. DS + IA take priority over User Flow prose.

### 5. Payment Modal — Enter to Confirm (Design System vs User Flow)
- **Conflict:** Design System §11.3 specifies the modal closes on Enter. User Flow UC-003 §4 puts the Enter action on the success modal (to print receipt).
- **Decision:** Both behaviors implemented: Enter on the payment modal confirms payment (DS §11.3), then Enter on the success modal prints the receipt (UC-003 §4).

### 6. Product Name Validation — Alphanumeric Only (System Logic vs SRS)
- **Conflict:** System Logic UC-004 §4 validation table requires "Alphanumeric only" for product names with error "Nama produk hanya boleh huruf dan angka". SRS §4.4 requires "karakter alfanumerik yang bersih dari tag skrip berbahaya" (clean of dangerous script tags, not strictly alphanumeric-only).
- **Decision:** Implemented SRS-level sanitization: HTML/script tags are stripped from product names, but accented/non-ASCII characters (e.g., "Nasi Goreng", "Jus Jeruk", "Mie Goreng") are allowed since SRS uses "alfanumerik" loosely meaning "clean text." The strict alphanumeric-only rule from sys_uc_004.md is not enforced.

### 7. PUT /api/v1/products/{id} (System Logic vs SRS)
- **Conflict:** System Logic UC-004 §3.4 defines a PUT endpoint for updating products. SRS F002 only specifies adding new products; Kasir cannot update existing products.
- **Decision:** PUT endpoint not implemented. Out of scope per SRS.

### 8. Daily Report Stock Inventory Table (Information Architecture vs Design System)
- **Conflict:** IA PAGE-004 specifies a full stock inventory table on `/laporan/harian` sorted by stock quantity ascending. The DS does not explicitly describe this table.
- **Decision:** Added the table as specified by IA. Used existing table styling patterns from the codebase.

## Out-of-Scope (per SRS §6)

The following are explicitly excluded:
- Multi-branch management
- Online payment gateway integration
- Membership / loyalty system
- Return/refund management
- Discount/promo system

## Known Limitations

- **Receipt:** Uses `window.print()` for browser print dialog; no thermal printer support.
- **Auth:** Uses localStorage for session (demo only). No JWT validation or token refresh.
- **Charts:** Monthly report bar chart uses Recharts `BarChart` with hardcoded dimensions.
- **Persistence:** All data stored in localStorage under key `pos_data`. To reset, clear this key and reload.
- **No pagination:** Product and transaction lists load all items in memory.
- **No debounce:** Search input fires on every keystroke (acceptable for demo data volume).
