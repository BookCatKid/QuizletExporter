# Quizlet Set Exporter

## What it does
A simple Chrome extension that, when opened on a Quizlet set page, fetches the terms and definitions for that set and converts them into a file. This extension was made for studykit users asking for quizlet exports in the discord. It does not require you to be logged in to Quizlet. Currently the only output format is csv.

Exporting images or rich text is not currently supported.

## Usage

1. Install the extension (see [INSTALL.md](INSTALL.md)).
2. Navigate to a Quizlet set page, e.g. https://quizlet.com/12345678.
3. Click the extension icon in your browser toolbar or extension popup menu.
4. Select the output format (currently only "Q&A CSV" is available).
5. Click "Export".
6. If there are no errors, you should be able to click Download CSV to get the file.

## Install (manual)

To install the extension manually (which is the only available option right now), see [INSTALL.md](INSTALL.md).

## Notes and behavior

- The extension does not collect or send any data to any server. All processing is done locally in your browser.
- The extension extracts the numeric set id from the page URL.
- The extension uses a quizlet webapi endpoint with credentials included, so it doesn't depend on the webpage being correctly formatted with the correct classNames etc...
- It of course fetches all terms and definitions using pagination if needed.
- CSV output follows this format exactly (header included):
  "question","answer"
  "...","..."

## Limitations & next steps
- Multi-language or rich text: this parser uses the plainText field. If your set uses richText or images they will not be exported.
- More output formats: currently only CSV is supported. Other formats like Anki, TSV, JSON etc could be added.
