Extraction scripts (for reproducibility, not needed to use the database).
They expect: the uploaded source files, and doc1.txt produced by:  pdftotext -layout doc1.pdf /tmp/doc1.txt
Order: extract1 -> extract2 -> extract3 -> extract4 -> finalize -> ../validate.py -> build_workbook
Paths inside the scripts point to the original working folders; adjust before re-running.
