# Waffle charts

Pie charts are the devil. They should be an instant F in any data visualization class. I'll give you an example of why.

What's the racial breakdown of journalism majors at UNL?

Here it is in a pie chart:


```r
library(tidyverse)
```

```
## Warning: package 'tidyverse' was built under R version 3.5.2
```

```
## ── Attaching packages ─────────────── tidyverse 1.3.0 ──
```

```
## ✓ ggplot2 3.2.1     ✓ purrr   0.3.3
## ✓ tibble  2.1.3     ✓ dplyr   0.8.3
## ✓ tidyr   1.0.0     ✓ stringr 1.4.0
## ✓ readr   1.3.1     ✓ forcats 0.4.0
```

```
## Warning: package 'ggplot2' was built under R version 3.5.2
```

```
## Warning: package 'tibble' was built under R version 3.5.2
```

```
## Warning: package 'tidyr' was built under R version 3.5.2
```

```
## Warning: package 'purrr' was built under R version 3.5.2
```

```
## Warning: package 'dplyr' was built under R version 3.5.2
```

```
## Warning: package 'stringr' was built under R version 3.5.2
```

```
## Warning: package 'forcats' was built under R version 3.5.2
```

```
## ── Conflicts ────────────────── tidyverse_conflicts() ──
## x dplyr::filter() masks stats::filter()
## x dplyr::lag()    masks stats::lag()
```

```r
enrollment <- read.csv("~/Box/Courses/JOUR407-Data-Visualization/Data/collegeenrollment.csv")

jour <- filter(enrollment, MajorName == "Journalism")

jdf <- jour %>% 
group_by(Race) %>%
summarise(
       total=sum(Count)) %>%
select(Race, total) %>% 
filter(total != 0)

ggplot(jdf, aes(x="", y=total, fill=Race)) + geom_bar(width = 1, stat = "identity") + coord_polar("y", start=0)
```

![](14-wafflecharts_files/figure-epub3/unnamed-chunk-1-1.png)<!-- -->

You can see, it's pretty white. But ... what about beyond that? How carefully can you evaluate angles and area?

Not well.

So let's introduce a better way: The Waffle Chart. Some call it a square pie chart. I personally hate that. Waffles it is. 

**A waffle chart is designed to show you parts of the whole -- proportionality**. How many yards on offense come from rushing or passing. How many singles, doubles, triples and home runs make up a teams hits. How many shots a basketball team takes are two pointers versus three pointers. 

First, install the library in the console: 

`install.packages('waffle')`

Now load it: 


```r
library(waffle)
```

Let's look at the debacle that was Nebraska vs. Ohio State this fall in Football. [Here's the box score](https://www.espn.com/college-football/matchup?gameId=401112241), which we'll use for this walkthrough. 

The easiest way to do waffle charts is to make vectors of your data and plug them in. To make a vector, we use the `c` or concatenate function, something we've done before. 

So let's look at offense. Rushing vs passing. 


```r
nu <- c("Rushing"=184, "Passing"=47)
oh <- c("Rushing"=368, "Passing"=212)
```

So what does the breakdown of the night look like?

The waffle library can break this down in a way that's easier on the eyes than a pie chart. We call the library, add the data, specify the number of rows, give it a title and an x value label, and to clean up a quirk of the library, we've got to specify colors. 


```r
waffle(nu, rows = 10, title="Nebraska's offense", xlab="1 square = 1 yard", colors = c("black", "red"))
```

![](14-wafflecharts_files/figure-epub3/unnamed-chunk-4-1.png)<!-- -->

Or, we could make this two teams in the same chart.


```r
passing <- c("Nebraska"=47, "Ohio State"=212)
```


```r
waffle(passing, rows = 10, title="Nebraska vs Ohio State: passing", xlab="1 square = 1 yard", colors = c("red", "black"))
```

![](14-wafflecharts_files/figure-epub3/unnamed-chunk-6-1.png)<!-- -->

## Waffle Irons

So what does it look like if we compare the two teams using the two vectors in the same chart? To do that -- and I am not making this up -- you have to create a waffle iron. Get it? Waffle charts? Iron? 


```r
iron(
 waffle(nu, rows = 10, title="Nebraska's offense", xlab="1 square = 1 yard", colors = c("black", "red")),
 waffle(oh, rows = 10, title="Ohio State's offense", xlab="1 square = 1 yard", colors = c("black", "red"))
)
```

![](14-wafflecharts_files/figure-epub3/unnamed-chunk-7-1.png)<!-- -->

What do you notice about this chart? Notice how the squares aren't the same size? Well, Ohio State outgained Nebraska by a long way. So the squares aren't the same size because the numbers aren't the same. We can fix that by adding an unnamed padding number so the number of shots add up to the same thing. Let's make the total for everyone be 580, Ohio State's total yards of offense. So to do that, we need to add a padding of 349 to Nebraska. REMEMBER: Don't name it or it'll show up in the legend.


```r
nu <- c("Rushing"=184, "Passing"=47, 349)
oh <- c("Rushing"=368, "Passing"=212, 0)
```

Now, in our waffle iron, if we don't give that padding a color, we'll get an error. So we need to make it white. Which, given our white background, means it will disappear.


```r
iron(
 waffle(nu, rows = 10, title="Nebraska's offense", xlab="1 square = 1 yard", colors = c("black", "red", "white")),
 waffle(oh, rows = 10, title="Ohio State's offense", xlab="1 square = 1 yard", colors = c("black", "red", "white"))
)
```

![](14-wafflecharts_files/figure-epub3/unnamed-chunk-9-1.png)<!-- -->

One last thing we can do is change the 1 square = 1 yard bit -- which makes the squares really small in this case -- by dividing our vector. Remember what you learned in Swirl about math on vectors?


```r
iron(
 waffle(nu/2, rows = 10, title="Nebraska's offense", xlab="1 square = 2 yards", colors = c("black", "red", "white")),
 waffle(oh/2, rows = 10, title="Ohio State's offense", xlab="1 square = 2 yards", colors = c("black", "red", "white"))
)
```

![](14-wafflecharts_files/figure-epub3/unnamed-chunk-10-1.png)<!-- -->

News flash: Ohio State crushed Nebraska. 
