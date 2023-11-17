spanish.dat is in ISO-8559-1
need to convert to UTF-8
acquired from: https://github.com/sbosio/rla-es/blob/master/sinonimos/palabras/th_es_v2.dat

//windows has iconv
cat spanish.dat | iconv -f iso8959-1 -t utf-8

warning: DON'T sort the spanish.txt file because it has a word followed by n lines of definitions

