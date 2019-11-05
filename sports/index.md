--- 
title: "Sports Data Analysis and Visualization"
subtitle: "Code, data, visuals and the Tidyverse for journalists and other storytellers"
author: "By Matt Waite"
date: July 29, 2019
bibliography:
- packages.bib
description: This book is the companion to the University of Nebraska-Lincoln's SPMC
  350 course in the College of Journalism and Mass Communications.
documentclass: book
link-citations: yes
site: bookdown::bookdown_site
biblio-style: apalike
output:
  bookdown::gitbook:
    highlight: tango
---

# Throwing cold water on hot takes

The 2018 season started out disasterously for the Nebraska Cornhuskers. The first game against a probably overmatched opponent? Called on account of an epic thunderstorm that plowed right over Memorial Stadium. The next game? Loss. The one following? Loss. The next four? All losses, after the fanbase was whipped into a hopeful frenzy by the hiring of Scott Frost, national title winning quarterback turned hot young coach come back home to save a mythical football program from the mediocrity it found itself mired in. 

All that excitement lay in tatters.

On sports talk radio, on the sports pages and across social media and cafe conversations, one topic kept coming up again and again to explain why the team was struggling: Penalties. The team was just committing too many of them. In fact, six games and no wins into the season, they were dead last in the FBS penalty yards.

Worse yet for this line of reasoning? Nebraska won game 7, against Minnesota, committing only six penalites for 43 yards, just about half their average over the season. Then they won game 8 against FCS patsy Bethune Cookman, committing only five penalties for 35 yards. That's a whopping 75 yards less than when they were losing. See? Cut the penalties, win games screamed the radio show callers. 

The problem? It's not true. Penalties might matter for a single drive. They may even throw a single game. But if you look at every top-level college football team since 2009, the number of penalty yards the team racks up means absolutely nothing to the total number of points they score. There's no relationship between them. Penalty yards have no discernable influence on points beyond just random noise. 

Put this another way: If you were Scott Frost, and a major college football program was paying you $5 million a year to make your team better, what should you focus on in practice? If you had growled at some press conference that you're going to work on penalties in practice until your team stops committing them, the results you'd get from all that wasted practice time would be impossible to separate from just random chance. You very well may reduce your penalty yards and still lose. 

How do I know this? Simple statistics. 

That's one of the three pillars of this book: Simple stats. The three pillars are:

1. Simple, easy to understand statistics ... 
2. ... extracted using simple code ...
3.  ... visualized simply to reveal new and interesting things in sports. 

Do you need to be a math whiz to read this book? No. I'm not one either. What we're going to look at is pretty basic, but that's also why it's so powerful. 

Do you need to be a computer science major to write code? Nope. I'm not one of those either. But anyone can think logically, and write simple code that is repeatable and replicable. 

Do you need to be an artist to create compelling visuals? I think you see where this is going. No. I can barely draw stick figures, but I've been paid to make graphics in my career. With a little graphic design know how, you can create publication worthy graphics with code. 

## Requirements and Conventions

This book is all in the R statistical language. To follow along, you'll do the following:

1. Install the R language on your computer. Go to the [R Project website](https://www.r-project.org/), click download R and select a mirror closest to your location. Then download the version for your computer. 
2. Install [R Studio Desktop](https://www.rstudio.com/products/rstudio/#Desktop). The free version is great. 

Going forward, you'll see passages like this:


```r
install.packages("tidyverse")
```

Don't do it now, but that is code that you'll need to run in your R Studio. When you see that, you'll know what to do.

## About this book

This book is the collection of class materials for the author's Sports Data Analysis and Visualization class at the University of Nebraska-Lincoln's College of Journalism and Mass Communications. There's some things you should know about it:

* It is free for students. 
* The topics will remain the same but the text is going to be constantly tinkered with. 
* What is the work of the author is copyright Matt Waite 2019.
* The text is [Attribution-NonCommercial-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-nc-sa/4.0/) Creative Commons licensed. That means you can share it and change it, but only if you share your changes with the same license and it cannot be used for commercial purposes. I'm not making money on this so you can't either.  
* As such, the whole book -- authored in Bookdown -- is [open sourced on Github](https://github.com/mattwaite/sportsdatabook). Pull requests welcomed! 


