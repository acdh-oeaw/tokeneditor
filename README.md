# tokeneditor

Tokeneditor allows you manually revise your XML datafiles.

The common use case is to revise results of automated data enrichment, e.g. part of speech recognition.

## Data model

Tokeneditor assumes your data might be presented as a table. Each row in the table is called token and each column is called token property.

To map your XML data to tokens and properties XPath expressions are used. Token XPath is run on the whole XML document while properties XPath are run on each token's node (so property values have to defined inside token nodes).
These XPath expressions as well as some additional informations are provided in a separate XML file. It has a very simple and self-explanatory structure - see examples in the sample_data directory.

## Installation

- Install the [REST backend](https://github.com/acdh-oeaw/tokeneditor-api)
- Clone the repo
- Rename `js/config.js.sample` to `js/config.js` and adjust the config
