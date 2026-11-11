/*
  One story for DN Libs.

  Each paragraph is a string. A blank is written as {label|original word}.
  - label: what the player is asked for ("noun", "plural noun", "verb ending in -ing", ...)
  - original: the word(s) the story actually used, shown on the "real story" side.
  Optional hints for less obvious labels go in `hints`, keyed by label.

  Blanks are kept out of direct quotes on purpose, so the result never puts
  invented words in a real person's mouth.
*/
window.DN_STORIES = window.DN_STORIES || [];
window.DN_STORIES.push({
  id: "dunkin",
  headline: "University of Nebraska-Lincoln to replace Love Library Dunkin’ in 2027",
  byline: "Justin Diep and Colton Knott",
  date: "Nov. 10, 2026",
  url: "https://www.dailynebraskan.com/news/university-of-nebraska-lincoln-to-replace-love-library-dunkin-in-2027/article_ee302f47-dc6b-4009-bfb8-052fabcb7621.html",
  hints: {
    "brand name": "e.g. Taco Bell, Crocs, Spotify",
    "year": "any year, past or future",
    "day of the week": "Monday through Sunday",
    "celebrity’s last name": "e.g. Swift, Kelce, Obama",
    "direction": "north, south, east, west, up …",
    "past-tense verb": "e.g. exploded, danced, sneezed",
    "beverage": "something you drink",
    "adverb": "usually ends in -ly",
    "number": "any number"
  },
  paragraphs: [
    "The University of Nebraska-Lincoln will no longer run on {brand name|Dunkin’}.",
    "The last remaining on-campus Dunkin’ in Adele Hall Learning Commons will be replaced by a University Dining Services-run {noun|cafe} starting in early 2027, Liz Lorang, dean of the University Libraries, announced {day of the week|Tuesday}.",
    "Lorang said in the announcement that having a university-run cafe will allow for greater local control of the menu, keep more {plural noun|money} within the university and allow students to use their meal plan.",
    "University dining and libraries plan to seek input from students to finalize details of the cafe and its menu.",
    "Dave Annis, director of University Dining Services, said he encourages current Dunkin’ employees to {verb|apply} for jobs within dining services.",
    "UNL Communications Librarian Joan Barnes said staffing for the new cafe will {adverb|entirely} depend on the cafe’s {adjective|new} menu and services.",
    "Dunkin’ first came to campus in 2016 with the opening of the Adele Hall Learning Commons in {celebrity’s last name|Love} Library.",
    "A second Dunkin’ opened at the Dinsdale Family Learning Commons on East Campus in 2021 but {past-tense verb|closed} before the start of the 2023-24 school year.",
    "However, Barnes recognized student frustrations of Dunkin’ leaving campus.",
    "The university’s current {beverage|coffee} offerings include Starbucks in the Nebraska Union and Nebraska East Union, Kiewit Cafe and Tazza Coffee in Knoll Residential Center, Scott Engineering Center, University Health Center and Morrill Hall."
  ]
});
