# Clustering

One common effort in sports is to classify teams and players -- who are this players peers? What teams are like this one? Who should we compare a player to? Truth is, most sports commentators use nothing more sophisticated that looking at a couple of stats or use the "eye test" to say a player is like this or that. 

There's better ways. 

In this chapter, we're going to use a method that sounds advanced but it really quite simple called k-means clustering. It's based on the concept of the k-nearest neighbor algorithm. You're probably already scared. Don't be. 

Imagine two dots on a scatterplot. If you took a ruler out and measured the distance between those dots, you'd know how far apart they are. In math, that's called the Euclidean distance. It's just the space between them in numbers. Where k-nearest neighbor comes in, you have lots of dots and you want measure the distance between all of them. What does k-means clustering do? It lumps them into groups based on the average distance between them. Players who are good on offense but bad on defense are over here, good offense good defense are over here. And using the Eucliean distance between them, we can decide who is in and who is out of those groups.

For this exercise, I want to look at Cam Mack, Nebraska's point guard and probably the most interesting player on Fred Hoiberg's first team. This is Mack's first year in major college basketball -- he played a year at a community college -- so we don't have much to go on. But with three games in the books, who does Cam Mack compare to? 

To answer this, we'll use k-means clustering. 

First thing we do is load some libraries and set a seed, so if we run this repeatedly, our random numbers are generated from the same base. If you don't have the cluster library, just add it on the console with `install.packages("cluster")`


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
library(cluster)
```

```
## Warning: package 'cluster' was built under R version 3.5.2
```

```r
set.seed(1234)
```

I've gone and scraped [stats for every player in this current season](https://unl.box.com/s/0g56ve61y6hakyxzr1u4t534721bqvg8) so let's load that up. 


```r
players <- read_csv("data/players20.csv")
```

```
## Parsed with column specification:
## cols(
##   .default = col_double(),
##   Team = col_character(),
##   Player = col_character(),
##   Class = col_character(),
##   Pos = col_character(),
##   Height = col_character(),
##   Hometown = col_character(),
##   `High School` = col_character(),
##   Summary = col_character()
## )
```

```
## See spec(...) for full column specifications.
```

To cluster this data properly, we have some work to do.

First, it won't do to have players who haven't played, so we can use filter to find anyone with greater than 0 minutes played. Next, Cam Mack is a guard, so let's just look at guards. Third, we want to limit the data to things that make sense to look at for Cam Mack -- things like shooting, three point shooting, assists, turnovers and points. 


```r
playersselected <- players %>% 
  filter(MP>0) %>% filter(Pos == "G") %>% 
  select(Player, Team, Pos, MP, `FG%`, `3P%`, AST, TOV, PTS) %>% 
  na.omit() 
```

Now, k-means clustering doesn't work as well with data that can be on different scales. So comparing a percentage to a count metric -- shooting percentage to points -- would create chaos because shooting percentages are a fraction of 1 and points, depending on when they are in the season, could be quite large. So we have to scale each metric -- put them on a similar basis using the distance from the max value as our guide. Also, k-means clustering won't work with text data, so we need to create a dataframe that's just the numbers, but scaled. We can do that with another select, and using mutate_all with the scale function. The `na.omit()` means get rid of any blanks, because they too will cause errors. 


```r
playersscaled <- playersselected %>% 
  select(MP, `FG%`, `3P%`, AST, TOV, PTS) %>% 
  mutate_all(scale) %>% 
  na.omit()
```

With k-means clustering, we decide how many clusters we want. Most often, researchers will try a handful of different cluster numbers and see what works. But there are methods for finding the optimal number. One method is called the Elbow method. One implementation of this, [borrowed from the University of Cincinnati's Business Analytics program](https://uc-r.github.io/kmeans_clustering), does this quite nicely with a graph that will help you decide for yourself. 

All you need to do in this code is change out the data frame -- `playersscaled` in this case -- and run it. 


```r
# function to compute total within-cluster sum of square 
wss <- function(k) {
  kmeans(playersscaled, k, nstart = 10 )$tot.withinss
}

# Compute and plot wss for k = 1 to k = 15
k.values <- 1:15

# extract wss for 2-15 clusters
wss_values <- map_dbl(k.values, wss)
```

```
## Warning: did not converge in 10 iterations

## Warning: did not converge in 10 iterations

## Warning: did not converge in 10 iterations

## Warning: did not converge in 10 iterations
```

```r
plot(k.values, wss_values,
       type="b", pch = 19, frame = FALSE, 
       xlab="Number of clusters K",
       ylab="Total within-clusters sum of squares")
```

![](30-clustering_files/figure-epub3/unnamed-chunk-5-1.png)<!-- -->

The Elbow method -- so named because you're looking for the "elbow" where the line flattens out. In this case, it looks like a K of 5 is ideal. So let's try that. We're going to use the kmeans function, saving it to an object called k5. We just need to tell it our dataframe name, how many centers (k) we want, and we'll use a sensible default for how many different configurations to try. 


```r
k5 <- kmeans(playersscaled, centers = 5, nstart = 25)
```

Let's look at what we get.


```r
k5
```

```
## K-means clustering with 5 clusters of sizes 863, 989, 242, 58, 495
## 
## Cluster means:
##           MP         FG%         3P%        AST        TOV        PTS
## 1 -0.8549890  0.02411493 -0.04833668 -0.7090093 -0.7700257 -0.7982928
## 2  0.5451701  0.14083415  0.12854961  0.1392254  0.2539075  0.3248641
## 3 -1.3602270 -1.98012908 -1.65325745 -0.9392522 -1.1172744 -1.1417360
## 4 -1.3785814  3.22934178  3.92207534 -0.9251265 -1.1485250 -1.1077564
## 5  1.2279089  0.26624900  0.17613521  1.5255303  1.5159849  1.4306790
## 
## Clustering vector:
##    [1] 5 2 2 2 2 1 1 1 1 2 2 5 2 1 1 1 5 2 1 1 3 3 5 2 2 2 2 2 1 4 2 2 5 2 2 1 3
##   [38] 5 5 2 2 1 2 1 1 5 2 2 2 1 1 2 5 2 2 2 2 1 1 3 2 5 1 2 2 1 1 1 1 1 2 2 5 2
##   [75] 2 1 3 1 3 5 2 2 2 1 1 1 1 5 2 2 2 2 1 3 5 2 2 1 1 1 5 2 1 2 1 1 1 1 4 2 2
##  [112] 1 1 1 2 1 3 5 2 2 2 1 1 1 5 2 2 1 3 3 5 2 2 1 1 1 5 2 2 2 2 1 1 5 5 2 2 2
##  [149] 2 3 5 2 2 2 1 1 1 3 5 2 2 2 2 5 1 3 5 5 2 2 2 2 1 1 2 2 2 2 1 1 1 1 1 1 5
##  [186] 2 3 3 5 2 2 2 1 1 3 1 5 5 2 2 1 1 1 4 3 5 2 2 5 2 2 1 1 1 3 5 2 1 1 1 3 3
##  [223] 5 5 2 2 2 2 2 3 5 2 2 5 1 5 2 5 2 2 1 1 1 2 2 2 2 2 1 3 5 5 5 2 2 2 1 1 3
##  [260] 3 5 5 2 2 2 1 1 1 3 5 5 2 2 2 1 1 1 5 2 2 2 3 5 5 2 2 1 3 2 5 5 2 5 2 1 1
##  [297] 5 2 2 2 1 1 1 1 1 5 2 2 1 3 1 3 3 5 5 2 2 1 1 5 5 2 2 2 1 1 2 2 2 2 1 1 1
##  [334] 5 5 2 2 2 2 1 5 5 2 1 1 1 3 5 2 2 2 2 1 3 5 5 2 1 2 1 1 3 3 5 2 2 2 2 1 1
##  [371] 1 5 5 2 2 1 1 1 1 1 1 1 5 5 2 5 2 1 1 1 3 5 5 2 1 1 5 5 2 2 1 3 5 5 1 1 1
##  [408] 5 5 2 1 1 3 5 2 2 2 2 1 1 1 4 5 2 2 2 2 1 1 1 5 5 2 1 1 2 5 2 2 2 2 1 3 5
##  [445] 5 2 2 1 1 1 1 5 5 2 2 1 3 5 2 2 2 1 1 1 1 2 5 2 2 2 1 1 1 5 2 2 1 1 1 1 3
##  [482] 5 5 2 2 1 1 3 3 5 5 2 1 1 2 1 5 5 2 2 2 1 3 3 2 2 2 5 1 1 5 2 2 2 2 1 3 5
##  [519] 2 2 2 1 1 4 1 5 5 2 2 2 1 3 4 5 5 2 5 1 1 1 3 5 2 2 2 2 1 1 1 1 5 5 2 1 1
##  [556] 1 5 5 2 2 2 1 1 3 2 2 2 2 1 3 3 3 2 2 2 1 1 1 3 5 5 5 1 1 1 1 3 3 5 5 2 2
##  [593] 1 2 5 5 2 2 2 2 1 1 4 5 2 2 1 3 3 3 5 2 2 2 2 1 1 3 3 5 5 2 2 1 5 2 2 2 1
##  [630] 1 3 5 2 5 2 1 1 3 5 2 2 2 1 4 3 5 2 2 2 2 1 2 2 2 2 2 2 1 1 1 5 2 5 1 1 1
##  [667] 5 2 2 5 1 1 1 3 4 5 2 2 1 1 1 5 5 2 2 2 1 1 1 3 5 2 2 2 5 1 1 2 2 2 1 3 3
##  [704] 3 2 5 2 2 2 2 4 1 3 2 5 5 2 5 1 3 5 5 2 2 1 1 3 1 2 5 2 1 1 2 2 5 2 2 1 2
##  [741] 1 1 5 5 2 1 5 5 2 1 1 1 1 4 3 5 2 2 1 1 5 2 2 2 2 1 1 5 5 5 2 2 1 4 2 2 2
##  [778] 1 1 1 1 1 5 2 2 2 2 1 1 3 3 2 2 2 2 2 4 1 4 1 1 2 2 5 2 2 2 1 5 2 2 2 1 1
##  [815] 1 2 5 5 2 2 3 1 3 3 5 2 2 2 1 3 5 2 2 1 1 1 1 1 1 2 2 2 2 2 1 3 3 5 2 2 2
##  [852] 1 1 2 1 5 2 2 2 1 5 2 1 1 1 5 2 2 2 1 1 1 5 5 2 2 1 1 1 4 5 2 2 2 3 2 5 2
##  [889] 1 2 1 1 1 4 5 2 2 3 1 1 3 2 5 2 2 1 2 2 5 2 1 1 3 3 3 5 5 2 2 1 3 3 5 2 1
##  [926] 1 1 2 2 2 2 1 2 1 1 1 1 5 5 2 5 1 1 1 1 1 5 2 2 2 1 1 5 2 2 2 1 1 1 5 2 2
##  [963] 2 2 1 1 5 2 2 1 1 1 3 3 5 5 2 2 2 1 1 1 3 5 5 2 1 1 1 1 1 1 5 5 2 1 2 3 5
## [1000] 2 2 1 1 1 3 5 5 2 2 1 1 1 1 1 5 2 2 2 2 2 1 1 3 2 5 2 2 2 2 2 1 4 3 5 5 2
## [1037] 2 3 1 5 2 2 2 1 3 1 2 5 2 1 2 1 2 3 2 5 2 2 2 1 3 5 2 5 5 2 1 1 3 5 2 5 1
## [1074] 1 3 3 5 2 5 2 1 1 1 1 1 1 1 5 2 2 1 1 1 1 5 5 5 2 1 1 1 1 3 5 2 2 2 1 2 1
## [1111] 1 4 5 5 1 2 1 1 1 1 5 5 2 2 2 1 2 1 1 1 3 2 2 2 1 2 2 1 1 4 1 3 5 2 2 2 1
## [1148] 1 5 5 5 2 1 3 5 5 2 2 1 3 2 5 2 2 2 1 1 1 5 5 2 2 2 1 3 1 5 2 2 1 1 4 3 1
## [1185] 3 5 2 5 1 3 1 3 5 2 2 1 3 1 3 1 3 5 2 2 2 1 1 1 3 1 5 2 5 2 2 1 5 5 2 2 1
## [1222] 5 5 2 1 1 2 5 2 2 2 1 1 5 5 2 2 2 3 1 4 5 2 2 2 1 1 3 2 2 2 2 1 2 1 1 5 5
## [1259] 2 1 1 3 3 1 5 5 5 2 1 1 3 5 2 2 2 2 3 5 2 2 1 3 3 5 5 2 2 2 1 4 1 2 5 5 2
## [1296] 2 1 3 5 2 2 2 1 4 3 5 2 1 1 1 1 3 3 5 2 2 2 2 1 1 2 2 2 2 2 1 5 2 2 2 2 1
## [1333] 1 3 1 5 5 2 2 2 1 1 1 2 2 2 5 2 1 1 2 5 2 1 2 2 1 1 2 5 1 2 1 1 4 3 5 5 2
## [1370] 2 2 1 3 3 5 2 2 2 1 3 4 4 2 2 2 2 1 2 1 3 5 2 2 1 1 1 1 3 5 5 2 1 1 1 5 2
## [1407] 5 1 1 4 5 2 2 2 1 1 3 3 2 2 2 2 2 1 3 4 3 5 1 1 1 1 1 3 5 5 2 2 2 1 1 4 3
## [1444] 3 3 2 1 1 1 1 5 2 2 2 1 1 1 3 2 2 2 2 2 1 5 2 2 2 2 1 1 3 1 5 5 1 1 1 1 1
## [1481] 5 2 2 1 1 1 3 5 5 2 1 1 1 1 1 5 5 2 2 1 1 5 5 5 2 2 1 4 3 2 5 2 2 2 1 1 2
## [1518] 2 2 2 1 1 1 1 1 2 2 2 2 1 1 1 5 5 2 2 1 3 3 5 5 5 2 2 1 5 2 2 1 1 1 1 2 2
## [1555] 2 2 2 5 2 3 2 5 5 1 5 2 2 2 1 1 1 5 2 1 1 1 1 1 3 5 2 5 2 1 1 1 1 4 5 2 2
## [1592] 2 1 5 2 5 1 3 1 1 2 2 2 2 2 2 1 3 3 2 2 2 2 2 2 1 1 3 5 2 5 2 1 1 2 1 1 4
## [1629] 3 3 3 5 5 5 2 2 1 5 2 2 2 2 1 3 2 2 2 2 2 1 1 3 5 5 2 1 2 1 1 4 3 5 2 2 2
## [1666] 1 3 3 2 2 2 1 4 5 5 2 2 2 1 1 1 2 5 2 2 2 1 1 1 5 2 2 2 1 3 1 5 2 2 2 1 2
## [1703] 1 1 1 5 5 2 2 1 5 2 2 2 2 1 1 1 5 2 2 1 1 1 1 4 5 5 2 2 2 1 1 1 2 5 2 5 2
## [1740] 5 2 2 2 2 1 3 5 2 2 1 1 3 4 5 5 2 2 1 1 3 5 2 2 2 2 3 2 5 2 2 1 1 5 2 2 1
## [1777] 1 1 1 3 2 5 5 2 1 1 1 5 2 2 2 4 1 1 1 3 5 5 5 2 2 2 1 4 5 5 2 2 1 5 2 2 2
## [1814] 1 2 1 3 1 4 3 2 5 5 1 1 1 5 5 2 2 1 1 3 3 5 5 2 2 1 1 1 5 5 5 5 2 3 5 2 5
## [1851] 2 2 1 1 1 1 2 2 2 5 5 1 4 5 2 5 1 1 1 1 3 5 2 2 2 1 3 2 5 5 1 2 1 4 3 5 2
## [1888] 5 1 1 1 3 2 2 2 2 2 2 1 3 1 2 2 2 1 2 1 1 5 2 2 1 1 2 5 2 2 1 1 1 4 5 2 2
## [1925] 2 2 1 1 1 5 2 5 2 1 1 3 3 5 2 2 1 1 1 2 5 2 1 2 1 5 2 2 1 1 1 3 2 2 2 2 1
## [1962] 5 2 2 2 2 2 1 4 4 5 5 5 2 2 1 1 3 3 3 5 2 2 5 2 1 1 1 1 1 2 2 1 2 1 1 3 5
## [1999] 5 2 2 1 1 1 5 2 2 5 1 2 1 1 1 5 5 5 2 2 3 5 2 2 2 2 1 1 5 2 2 2 3 3 4 4 5
## [2036] 2 1 2 3 5 5 2 1 3 5 2 2 2 2 2 1 1 4 3 5 2 2 1 1 3 5 2 1 1 1 3 3 1 5 5 2 2
## [2073] 1 1 1 1 5 5 5 1 1 1 3 5 5 2 2 2 1 1 1 3 5 2 2 5 1 1 1 3 5 5 2 2 2 1 1 4 3
## [2110] 2 2 2 2 2 1 1 1 5 5 5 2 1 1 1 1 2 2 1 1 1 3 2 5 2 2 2 2 1 1 5 2 5 2 2 1 3
## [2147] 5 2 2 2 1 1 3 1 5 5 2 2 1 1 1 5 5 2 2 2 1 1 4 5 2 2 1 1 4 3 4 5 5 2 2 1 1
## [2184] 5 2 2 2 1 1 1 3 2 5 2 2 2 2 1 1 4 1 2 2 5 2 2 1 1 1 1 1 2 2 2 5 2 1 1 3 5
## [2221] 2 2 2 1 1 1 1 5 2 2 1 1 5 5 2 2 1 1 1 1 1 5 5 2 2 2 1 1 3 1 5 2 2 2 1 1 1
## [2258] 3 2 2 5 2 2 1 1 5 2 5 2 2 1 1 1 2 2 2 2 1 2 1 3 1 5 5 5 2 1 1 1 2 5 2 2 1
## [2295] 1 2 2 2 2 2 1 1 1 4 5 2 2 2 1 1 3 5 2 2 2 1 1 2 2 2 2 1 2 1 1 5 2 2 1 1 1
## [2332] 2 5 2 2 2 2 1 1 1 1 5 2 5 2 1 1 1 4 5 5 5 1 3 5 5 2 1 1 4 3 2 5 2 2 2 2 2
## [2369] 2 2 2 3 3 5 5 1 1 5 5 2 2 1 3 5 2 2 1 1 1 5 5 2 2 2 3 1 5 2 1 1 1 1 3 3 5
## [2406] 5 2 2 2 1 1 1 4 5 2 2 2 3 1 1 2 2 5 2 2 2 1 1 1 2 5 2 2 2 1 1 1 3 5 5 2 1
## [2443] 1 5 5 2 2 2 1 1 4 5 2 2 2 1 1 1 5 2 2 2 2 2 1 4 5 5 2 2 1 1 1 1 5 2 5 2 2
## [2480] 1 3 3 5 5 2 2 1 1 3 5 5 2 5 2 2 1 1 1 5 5 1 1 1 3 1 5 5 2 2 1 1 3 1 3 5 2
## [2517] 2 2 2 5 5 2 2 2 2 3 3 1 1 2 1 1 1 1 1 3 5 2 2 2 1 1 1 3 5 2 2 2 1 1 5 2 2
## [2554] 1 1 1 1 5 2 2 1 1 1 3 3 3 5 2 2 2 1 1 3 3 5 5 2 2 1 1 1 3 5 5 2 2 2 1 3 1
## [2591] 5 5 2 2 1 1 5 2 2 2 2 1 1 1 1 1 1 5 5 5 1 1 1 1 3 2 2 5 2 3 1 3 3 5 5 2 1
## [2628] 3 3 5 2 2 2 1 1 1 1 1 1 5 2 2 2 1 1 1 1
## 
## Within cluster sum of squares by cluster:
## [1] 1430.7781 1341.0495  319.4278  250.5515 1094.8283
##  (between_SS / total_SS =  72.1 %)
## 
## Available components:
## 
## [1] "cluster"      "centers"      "totss"        "withinss"     "tot.withinss"
## [6] "betweenss"    "size"         "iter"         "ifault"
```

Interpreting this output, the very first thing you need to know is that **the cluster numbers are meaningless**. They aren't ranks. They aren't anything. After you have taken that on board, look at the cluster sizes at the top. Clusters 3 and 5 are pretty large compared to others. That's notable. Then we can look at the cluster means. For reference, 0 is going to be average. So group 1 are well above average on minutes played. Group 3 is slightly above, group 5 is slightly below. In fact, group 5 is below average on every metric. Group 3 is slightly above average on all metrics. 

So which group is Cam Mack in? Well, first we have to put our data back together again. In K5, there is a list of cluster assignments in the same order we put them in, but recall we have no names. So we need to re-combine them with our original data. We can do that with the following:


```r
playercluster <- data.frame(playersselected, k5$cluster) 
```

Now we have a dataframe called playercluster that has our player names and what cluster they are in. The fastest way to find Cam Mack is to double click on the playercluster table in the environment and use the search in the top right of the table. Because this is based on some random selections of points to start the groupings, these may change from person to person, but Mack is in Group 1 in my data. 

We now have a dataset and can plot it like anything else. Let's get Cam Mack and then plot him against the rest of college basketball on assists versus minutes played. 


```r
cm <- playercluster %>% filter(Player == "Cameron Mack")
```


```r
ggplot() + 
  geom_point(data=playercluster, aes(x=MP, y=AST, color=k5.cluster)) + 
  geom_point(data=cm, aes(x=MP, y=AST), color="red")
```

![](30-clustering_files/figure-epub3/unnamed-chunk-10-1.png)<!-- -->

Not bad, not bad. But who are Cam Mack's peers? If we look at the numbers in Group 1, there's 335 of them. So let's limit them to just Big Ten guards. Unfortunately, my scraper didn't quite work and in the place of Conference is the coach's name. So I'm going to have to do this the hard way and make a list of Big Ten teams and filter on that. Then I'll sort by minutes played. 


```r
big10 <- c("Nebraska Cornhuskers", "Iowa Hawkeyes", "Minnesota Golden Gophers", "Illinois Fighting Illini", "Northwestern Wildcats", "Wisconsin Badgers", "Indiana Hoosiers", "Purdue Boilermakers", "Ohio State Buckeyes", "Michigan Wolverines", "Michigan State Spartans", "Penn State Nittany Lions", "Rutgers Scarlet Knights", "Maryland Terrapins")

playercluster %>% filter(k5.cluster == 4) %>% filter(Team %in% big10) %>% arrange(desc(MP))
```

```
##          Player                    Team Pos MP   FG.  X3P. AST TOV PTS
## 1   Cole Bajema     Michigan Wolverines   G 35 0.750 0.571   0   2  24
## 2    Reese Mona      Maryland Terrapins   G 30 1.000 1.000   2   1   9
## 3   Joey Downes Rutgers Scarlet Knights   G 10 0.667 1.000   0   1   8
## 4 Travis Valmon      Maryland Terrapins   G  8 0.500 1.000   0   0   4
## 5  Cooper Bybee        Indiana Hoosiers   G  4 1.000 1.000   0   0   3
##   k5.cluster
## 1          4
## 2          4
## 3          4
## 4          4
## 5          4
```

So there are the 8 guards most like Cam Mack in the Big Ten. It'll be interesting to watch this evolve over the season. Fred Hoiberg and others think he might be one of the best guards in the league. We'll see, using cluster analysis. 

## Advanced metrics

How much does this change if we change the metrics? I used pretty standard box score metrics above. What if we did it using Player Efficiency Rating, True Shooting Percentage, Point Production, Assist Percentage, Win Shares Per 40 Minutes and Box Plus Minus (you can get definitions of all of them by [hovering over the stats on Nebraksa's stats page](https://www.sports-reference.com/cbb/schools/nebraska/2020.html)). 

We'll repeat the process. Filter out players who don't play, players with stats missing, and just focus on those stats listed above. 


```r
playersadvanced <- players %>% 
  filter(MP>0) %>% 
  filter(Pos == "G") %>% 
  select(Player, Team, Pos, PER, `TS%`, PProd, `AST%`, `WS/40`, BPM) %>% 
  na.omit() 
```

Now to scale them. 


```r
playersadvscaled <- playersadvanced %>% 
  select(PER, `TS%`, PProd, `AST%`, `WS/40`, BPM) %>% 
  mutate_all(scale) %>% 
  na.omit()
```

Let's find the optimal number of clusters.


```r
# function to compute total within-cluster sum of square 
wss <- function(k) {
  kmeans(playersadvscaled, k, nstart = 10 )$tot.withinss
}

# Compute and plot wss for k = 1 to k = 15
k.values <- 1:15

# extract wss for 2-15 clusters
wss_values <- map_dbl(k.values, wss)
```

```
## Warning: did not converge in 10 iterations

## Warning: did not converge in 10 iterations

## Warning: did not converge in 10 iterations

## Warning: did not converge in 10 iterations
```

```r
plot(k.values, wss_values,
       type="b", pch = 19, frame = FALSE, 
       xlab="Number of clusters K",
       ylab="Total within-clusters sum of squares")
```

![](30-clustering_files/figure-epub3/unnamed-chunk-14-1.png)<!-- -->

Looks like 5 again. 


```r
advk5 <- kmeans(playersadvscaled, centers = 5, nstart = 25)
```

What do we have here?


```r
advk5
```

```
## K-means clustering with 5 clusters of sizes 104, 632, 766, 1253, 9
## 
## Cluster means:
##          PER        TS%      PProd       AST%      WS/40        BPM
## 1 -2.6922417 -2.6802561 -1.1497380 -1.0109009 -2.8398288 -2.8455990
## 2 -0.6089002 -0.6736304 -0.8322766 -0.2324539 -0.5651578 -0.6493960
## 3  0.5022214  0.2566711  1.2288970  0.7362004  0.4083263  0.5004325
## 4  0.1594366  0.3741799 -0.2279088 -0.2650562  0.2130658  0.2118878
## 5  8.9269330  4.3359455 -1.1326482  2.2478231  8.0858448  6.3926472
## 
## Clustering vector:
##    [1] 3 4 4 4 4 2 4 2 4 3 4 3 4 4 2 4 3 4 4 4 2 2 4 1 3 4 4 4 4 2 4 4 3 3 3 4 4
##   [38] 4 2 3 3 4 4 4 4 4 2 2 3 4 4 4 4 4 4 1 3 3 4 4 3 4 4 4 4 3 3 3 4 4 4 2 2 2
##   [75] 2 2 3 4 3 4 3 2 1 4 2 3 4 4 4 4 2 4 2 3 3 4 4 4 2 2 3 3 4 2 2 2 2 3 4 4 4
##  [112] 4 4 2 2 4 3 3 4 4 4 4 2 2 3 3 4 2 4 2 2 3 3 4 4 2 4 5 1 3 4 4 4 2 4 3 4 4
##  [149] 4 4 2 4 1 3 3 4 4 3 4 2 3 3 4 2 4 2 5 2 1 3 3 4 4 4 3 4 2 3 3 4 3 4 4 4 2
##  [186] 3 3 3 4 4 4 4 4 4 2 3 3 2 2 3 4 4 4 2 4 2 4 3 3 4 4 2 4 4 5 2 3 4 4 3 4 4
##  [223] 4 2 4 2 3 4 4 4 4 2 2 3 3 4 4 4 4 4 2 3 4 3 3 4 3 4 3 4 4 4 4 4 2 1 3 3 3
##  [260] 4 2 4 1 3 3 3 4 4 4 4 4 2 3 1 1 3 3 4 4 4 4 4 2 2 3 3 4 4 4 4 4 4 4 3 4 4
##  [297] 4 3 2 3 3 3 4 2 1 3 3 3 4 3 4 4 4 3 3 4 3 4 4 4 4 4 3 4 2 2 2 2 2 2 3 3 4
##  [334] 4 2 2 3 3 4 4 2 4 4 3 4 2 4 2 4 2 3 3 4 4 2 4 4 3 3 4 2 2 2 2 3 4 3 2 4 2
##  [371] 2 3 3 4 4 2 2 2 2 2 3 4 3 4 3 4 4 3 3 3 4 4 4 4 2 2 2 2 4 2 3 3 4 3 2 4 2
##  [408] 4 1 3 3 4 4 2 2 3 3 3 4 4 4 1 3 3 2 2 1 4 1 3 3 4 4 2 2 2 3 4 4 4 2 2 2 2
##  [445] 4 3 3 4 3 4 4 4 2 3 3 4 4 4 2 3 3 4 4 4 4 4 1 1 3 3 4 4 2 2 2 2 3 3 4 4 2
##  [482] 2 1 3 4 4 4 2 2 4 2 3 3 4 4 4 4 2 2 3 3 2 2 2 2 2 2 1 3 3 4 4 2 4 2 1 3 3
##  [519] 4 4 3 2 2 3 3 3 4 2 2 2 2 2 3 4 4 3 2 2 2 1 1 3 4 4 2 2 2 2 3 4 4 4 2 2 4
##  [556] 4 3 3 4 4 4 4 2 4 3 3 3 3 4 4 2 1 3 4 4 4 3 4 4 2 4 3 3 4 4 2 4 3 3 4 4 2
##  [593] 4 4 2 3 4 4 2 4 2 2 1 3 3 4 4 4 2 4 1 3 3 3 4 4 2 4 2 1 3 3 4 4 4 4 2 3 3
##  [630] 4 4 4 4 2 2 4 3 4 4 4 2 1 1 3 3 3 4 4 4 2 2 2 3 3 3 4 4 3 3 4 4 4 2 4 1 3
##  [667] 4 3 4 4 4 2 3 4 2 2 2 5 1 2 3 3 4 4 3 4 4 4 4 3 4 3 2 4 2 1 3 4 3 4 4 4 3
##  [704] 3 4 3 4 4 4 2 5 3 4 4 4 2 2 3 3 4 4 4 2 4 2 4 4 1 3 4 3 4 3 2 4 4 4 3 3 4
##  [741] 2 2 2 3 3 4 4 4 4 4 2 1 3 3 3 4 3 4 2 1 3 3 4 4 4 2 2 2 3 3 3 4 4 4 2 3 3
##  [778] 3 3 2 4 4 2 4 3 3 3 4 3 3 4 4 4 4 2 4 2 3 3 4 2 2 1 3 3 4 4 4 3 4 3 3 3 4
##  [815] 4 4 3 3 3 4 4 4 2 4 2 3 4 4 3 2 4 2 4 2 3 4 4 4 4 4 2 4 2 2 3 1 3 3 3 4 4
##  [852] 2 2 3 3 4 4 4 4 2 3 3 3 4 4 2 4 2 2 2 3 4 2 4 4 2 1 3 4 4 4 4 4 2 4 4 3 4
##  [889] 3 4 4 4 2 4 3 4 3 4 4 4 3 4 3 3 3 4 4 3 4 4 4 2 2 3 3 4 4 2 4 4 3 3 3 4 2
##  [926] 2 2 4 3 4 4 4 4 1 3 3 4 4 2 2 4 2 4 3 4 4 2 2 2 2 3 3 3 4 4 3 4 2 4 2 2 2
##  [963] 2 2 3 3 4 3 4 2 2 3 3 4 2 3 4 4 4 3 4 2 2 4 4 2 3 3 3 3 4 2 2 4 4 3 3 3 4
## [1000] 4 4 3 4 4 4 4 4 2 3 3 4 4 4 4 2 3 4 4 4 2 4 2 1 3 3 3 4 4 4 4 4 2 3 3 4 4
## [1037] 4 4 4 4 4 3 3 4 4 4 1 3 3 4 4 2 4 2 3 3 4 4 4 4 4 2 4 3 3 4 4 4 4 2 4 2 3
## [1074] 3 3 4 4 4 2 4 4 2 3 3 3 4 2 2 3 4 3 4 4 2 4 4 3 2 4 4 4 2 1 2 3 4 4 4 2 2
## [1111] 3 3 3 3 2 4 2 2 2 3 3 3 4 2 2 1 3 3 3 3 4 4 2 4 2 4 4 3 4 2 4 2 2 2 3 3 3
## [1148] 4 4 4 4 4 2 3 3 4 4 4 2 4 2 4 3 3 4 4 4 2 4 2 3 3 4 4 4 4 3 4 4 4 4 3 3 4
## [1185] 4 4 4 4 3 4 4 1 3 4 3 4 4 4 3 3 3 3 2 1 3 3 3 4 4 4 1 3 3 4 4 4 4 2 4 3 3
## [1222] 4 4 4 2 2 2 3 4 3 2 4 5 2 4 2 3 4 3 4 2 4 2 3 4 3 2 2 2 2 2 1 3 4 4 4 4 4
## [1259] 2 2 4 3 4 3 3 4 2 3 3 4 4 2 3 3 4 2 2 3 3 3 4 4 2 2 3 3 4 4 2 2 4 4 3 4 4
## [1296] 4 2 2 4 4 3 4 4 4 4 4 4 3 3 4 4 4 4 2 2 3 3 3 2 2 2 1 3 3 4 3 4 2 3 4 4 2
## [1333] 2 1 3 3 4 4 4 4 4 2 3 3 3 3 4 4 2 3 3 4 4 2 4 2 3 3 4 4 4 3 4 2 2 3 3 3 4
## [1370] 4 2 4 3 3 3 4 3 4 2 3 4 4 4 4 2 2 2 3 3 3 4 4 4 4 2 4 3 4 4 3 3 4 2 3 3 3
## [1407] 4 4 4 4 4 3 3 4 4 4 2 2 4 2 3 3 4 4 2 4 2 1 3 3 3 3 2 2 4 4 4 2 2 2 2 2 2
## [1444] 2 2 3 4 3 4 3 2 4 2 3 3 4 4 2 4 3 3 3 4 4 4 3 4 4 4 2 2 1 2 1 4 3 3 4 4 4
## [1481] 2 5 4 1 3 4 2 2 2 2 2 3 3 4 3 4 2 2 2 2 1 1 4 4 4 2 2 3 3 4 4 4 4 4 2 1 4
## [1518] 3 3 4 4 4 4 3 4 3 3 4 4 4 2 4 3 3 4 4 2 2 2 3 3 4 4 2 4 2 3 3 4 4 2 2 2 2
## [1555] 3 3 4 4 4 2 3 3 4 4 3 2 4 2 3 3 4 2 4 4 4 3 4 4 4 2 4 2 2 2 3 3 4 4 4 4 2
## [1592] 4 3 3 4 4 2 2 1 3 3 3 4 4 2 3 3 4 4 4 4 4 4 4 4 4 4 3 4 1 3 3 3 4 4 3 3 3
## [1629] 4 4 4 4 3 2 2 2 2 2 2 2 3 3 3 4 4 4 4 4 4 3 4 4 3 2 3 3 3 2 2 2 2 4 4 4 4
## [1666] 4 2 2 2 2 3 4 4 4 4 4 4 4 2 3 3 3 4 2 4 2 2 2 5 2 2 1 3 3 3 2 2 2 2 3 4 4
## [1703] 4 4 2 1 3 3 3 3 4 4 4 1 3 3 4 4 4 2 4 4 4 2 3 4 3 4 2 2 1 1 3 3 3 4 4 1 3
## [1740] 3 3 4 4 2 4 4 2 1 4 3 3 4 4 2 2 2 4 3 3 4 4 4 2 2 3 4 4 4 4 4 4 2 4 3 3 4
## [1777] 4 4 3 4 4 2 4 4 2 4 2 3 4 4 2 3 2 4 4 3 3 4 4 3 2 2 2 3 3 3 3 4 3 4 2 2 4
## [1814] 4 2 3 2 3 2 2 2 2 3 3 3 4 2 4 2 4 1 3 4 4 4 2 2 4 3 3 4 4 4 2 3 4 4 4 4 4
## [1851] 4 1 3 4 3 4 4 2 4 3 3 4 2 4 4 2 2 2 4 1 3 3 3 3 4 4 4 4 3 3 4 4 2 3 4 4 4
## [1888] 4 2 4 2 4 4 2 3 3 3 4 4 4 3 3 4 4 4 4 2 1 3 3 4 4 2 2 3 3 3 3 3 3 4 2 1 3
## [1925] 3 3 3 4 2 4 4 2 4 3 3 4 3 3 4 2 2 3 4 3 4 2 2 4 2 3 3 4 4 4 2 2 1 3 3 3 2
## [1962] 4 2 4 1 3 3 3 4 4 2 4 1 3 4 4 3 3 4 4 2 2 3 4 4 4 4 2 2 3 4 4 4 2 4 3 3 4
## [1999] 4 4 4 4 3 2 2 3 4 4 4 4 4 4 2 2 3 4 3 4 4 4 2 1 3 4 3 2 4 2 3 3 4 4 2 4 4
## [2036] 3 3 4 4 4 2 2 4 3 4 4 4 3 4 4 2 4 4 4 3 4 2 3 3 3 4 4 2 2 2 1 1 3 3 4 3 4
## [2073] 4 4 4 4 2 4 4 4 4 4 4 4 1 3 3 4 4 4 2 4 3 3 3 3 4 4 4 2 2 3 3 3 3 4 1 3 4
## [2110] 4 4 2 2 2 4 1 3 3 4 4 2 2 4 4 3 3 4 4 2 3 3 4 4 2 3 4 4 4 4 4 4 4 4 2 3 4
## [2147] 4 4 2 1 3 4 4 4 4 2 2 2 2 3 3 2 2 2 4 2 4 3 3 3 4 4 4 1 3 2 4 4 4 4 2 2 2
## [2184] 3 3 4 3 4 4 4 4 4 1 3 3 4 4 4 4 4 4 2 3 4 4 4 4 4 4 2 3 3 3 3 4 4 4 4 4 3
## [2221] 4 4 4 4 2 2 3 3 4 4 2 2 4 2 4 3 3 3 4 4 4 1 1 3 4 4 4 2 2 2 2 2 3 3 3 4 2
## [2258] 4 4 3 3 4 4 4 4 4 4 3 3 4 2 2 2 2 5 3 3 4 4 4 2 4 4 3 4 4 4 4 4 2 2 4 3 4
## [2295] 2 4 2 2 2 4 4 3 3 4 4 4 4 4 4 4 4 3 4 4 3 4 4 2 1 3 3 4 4 2 4 2 2 3 4 2 2
## [2332] 2 3 3 4 4 4 3 2 2 2 3 3 4 4 4 4 2 2 2 3 3 3 4 4 2 4 2 4 3 3 4 4 4 2 3 4 3
## [2369] 4 4 4 4 2 4 4 2 4 2 2 2 2 2 3 3 3 4 2 2 2 3 3 4 2 2 4 3 3 4 4 4 4 4 2 4 3
## [2406] 4 3 2 4 4 1 3 3 4 4 4 4 4 4 4 3 4 2 4 2 3 3 4 2 4 2 3 3 4 3 4 4 4 2 2 4 3
## [2443] 4 3 4 4 4 4 4 3 3 3 2 2 3 3 4 2 4 4 2 4 3 4 4 4 3 4 4 4 4 2 4 3 3 2 4 3 3
## [2480] 4 4 4 2 1 1 3 4 3 4 2 2 3 3 4 4 3 2 3 3 4 2 2 4 2 2 2 3 3 4 4 4 2 4 4 4 2
## [2517] 3 3 4 4 2 4 4 3 3 3 4 4 3 2 4 4 4 3 3 4 4 4 4 2 2 1 1 3 3 4 2 2 1 1 3 3 4
## [2554] 4 4 4 3 4 3 4 4 2 4 4 4 3 4 4 3 4 4 4 4 3 3 4 4 4 4 4 4 2 3 3 3 4 4 4 2 1
## [2591] 3 3 4 4 4 4 2 3 3 4 3 3 4 4 4 4 3 3 4 4 2 2 4 1 3 4 4 4 2 2 2 4 1 3 3 3 4
## [2628] 4 1 3 3 3 4 4 4 2 1 2 2 2 2 4 2 4 2 4 2 1 3 4 3 4 4 2 4 1 3 3 4 3 4 4 3 3
## [2665] 4 4 4 4 2 4 3 3 4 2 4 2 2 2 1 3 4 4 4 4 4 1 2 3 3 4 4 4 4 2 4 1 3 3 4 4 4
## [2702] 2 2 2 3 3 3 4 4 2 3 4 2 4 4 4 2 2 4 2 2 3 3 3 4 4 2 4 1 1 3 4 3 2 2 2 2 1
## [2739] 3 3 4 2 2 4 2 3 4 4 4 4 4 4 4 2 4 4 3 3 3 2 4 4 4 4
## 
## Within cluster sum of squares by cluster:
## [1]  737.6141 1248.0870 1849.5824 2624.4456  722.9391
##  (between_SS / total_SS =  56.7 %)
## 
## Available components:
## 
## [1] "cluster"      "centers"      "totss"        "withinss"     "tot.withinss"
## [6] "betweenss"    "size"         "iter"         "ifault"
```

Looks like this time, cluster 1 is all below average and cluster 5 is all above. Which cluster is Cam Mack in?


```r
playeradvcluster <- data.frame(playersadvanced, advk5$cluster) 
```

Cluster 5 on my dataset. So three games in, we can say he's in a big group of players who are all above average on these advanced metrics. 

Now who are his Big Ten peers?


```r
playeradvcluster %>% 
  filter(advk5.cluster == 5) %>% 
  filter(Team %in% big10) %>% 
  arrange(desc(PProd))
```

```
##  [1] Player        Team          Pos           PER           TS.          
##  [6] PProd         AST.          WS.40         BPM           advk5.cluster
## <0 rows> (or 0-length row.names)
```

Sorting on Points Produced, Cam Mack is eighth out of the 31 guards in the Big Ten who land in Cluster 5. 

It's early goings, but watch this player. He's fun to watch and the stats back it up. 
