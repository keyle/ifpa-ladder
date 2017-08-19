# ifpa-ladder
Shows changes in a country's IFPA top 100 ladder since last run, using git diff.

The output is pretty gnarly because it's designed to be consumed straight from a Slack bot and displayed in a channel. Feel free to mod the output (e.g. removing the :emojis:).

### Expected output

```
:flip: The following changes occured in the <https://www.ifpapinball.com/rankings/country.php?country=7|IFPA AUS Top 100>: :flag-au:
:trophy: <https://www.ifpapinball.com/player.php?p=13453|Nick Keros> is now 97th (+1) :arrow_up:
```

### Tailor it to your country

Change the country ID (search for country=7) where '7' is based off the id given by the country.php page of IFPA.
