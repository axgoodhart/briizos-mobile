import os
from collections import defaultdict
from pypdf import PdfReader

DIRECTORY = "."
OUTPUT_PREFIX = "combined_"

files_by_ext = defaultdict(list)

# Collect files grouped by extension
for filename in os.listdir(DIRECTORY):
    filepath = os.path.join(DIRECTORY, filename)

    if not os.path.isfile(filepath):
        continue

    if filename.startswith(OUTPUT_PREFIX):
        continue  # Skip previously generated files

    name, ext = os.path.splitext(filename)
    if ext:
        files_by_ext[ext.lower()].append(filepath)

# Process each extension group
for ext, files in files_by_ext.items():
    files.sort()  # deterministic order

    # ---- PDF (proper merge) ----
    if ext == ".pdf":
        merger = PdfReader()

        for file in files:
            merger.append(file)

        output_file = f"{OUTPUT_PREFIX}pdf.pdf"
        merger.write(output_file)
        merger.close()

        print(f"Merged {len(files)} PDFs → {output_file}")

    # ---- CSV (preserve headers, visible separators) ----
    elif ext == ".csv":
        output_file = f"{OUTPUT_PREFIX}csv.csv"

        with open(output_file, "w", encoding="utf-8", errors="ignore") as outfile:
            for file in files:
                outfile.write("\n\n")
                outfile.write(f"===== START OF {os.path.basename(file)} =====\n")
                outfile.write("=" * 60 + "\n")

                with open(file, "r", encoding="utf-8", errors="ignore") as infile:
                    outfile.write(infile.read())

                outfile.write("\n")

        print(f"Combined {len(files)} CSV files → {output_file}")

    # ---- TXT / EML (labeled separation) ----
    elif ext in [".txt", ".eml"]:
        output_file = f"{OUTPUT_PREFIX}{ext[1:]}{ext}"

        with open(output_file, "w", encoding="utf-8", errors="ignore") as outfile:
            for file in files:
                outfile.write("\n\n")
                outfile.write(f"===== START OF {os.path.basename(file)} =====\n")
                outfile.write("=" * 60 + "\n")

                with open(file, "r", encoding="utf-8", errors="ignore") as infile:
                    outfile.write(infile.read())

                outfile.write("\n")

        print(f"Combined {len(files)} {ext} files → {output_file}")

    # ---- Generic binary fallback ----
    else:
        output_file = f"{OUTPUT_PREFIX}{ext[1:]}{ext}"

        with open(output_file, "wb") as outfile:
            for file in files:
                with open(file, "rb") as infile:
                    outfile.write(infile.read())

        print(f"Binary-concatenated {len(files)} {ext} files → {output_file}")
