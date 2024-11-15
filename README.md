
# RDFStarSQL

## The Hashing?

* multiformat blake2s 160 b58 ?

## The Schema
The schema is very under construction still.

Problems:

1. do quads need ids?
2. 

![])https://kroki.io/erd/svg/eNp9kMsKwjAQRffzFYMrNXbh1r8Q3ImLsR3aaJqG6aRQxH838UEpitt7zz0ZcjywtCdY2wpvjs7sdriwXrlmwSC2JRnxyiNS1M76Urhlr4s76Bh4WpQNCS6j2A32KqvUN9Q3M2PKBnJTNJDk1QZ9p-ijcwmA40FscPx9zwz7cudrZ4TpwQQwXTLuI1XJlzdg9KkHUwPkHLdFscbXm5PwBSXLuzBFscX8TRPSx_OFS_3LBOHKlqT_Td1H9LznB1ALhSb1D2NPi0o=)

<!--

https://github.com/BurntSushi/erd
https://kroki.io/#try

Cardinality    Syntax
0 or 1         ?
exactly 1      1
0 or more      *
1 or more      +


[Term]
*id {label: "integer primary key autoincrement"}
type {label: "char (uri, str)"}
hash {label: "int"}
val {label: "varchar, not null"}

[Triple]
*id {label: "int, not null"}
hash {label: "integer, not null"}
+s
+p
+o

[Quad]
*hash
+triple
+g

Quad 1--* Triple {label: "triple"}
Triple +--1 Term {label: "subject"}
Triple +--1 Term {label: "predicate"}
Triple +--1 Term {label: "object"}
Quad +--1 Term {label: "graph"}


-->