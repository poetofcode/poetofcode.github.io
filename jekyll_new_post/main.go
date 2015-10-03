package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"
)

var trans map[string]string

func showHelp(progName string) {
	log.Printf("\n\nИнструкция: укажите, пожалуйста, заголовок поста в качестве параметра командной сроки. Например:\n\n   %s \"Как я провёл лето\"\n\n", progName)
}

func makeTranslitArr() map[string]string {
	translit := map[string]string{
		" ": "-", "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e",
		"ё": "yo", "ж": "", "з": "z", "и": "i", "й": "j", "к": "k", "л": "l",
		"м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t",
		"у": "u", "ф": "f", "х": "h", "ц": "c", "ч": "ch", "ш": "sh", "щ": "shh",
		"ъ": "", "ы": "yu", "ь": "", "э": "e", "ю": "yu", "я": "ya",
	}

	return translit
}

func toTranslit(orig string) string {
	var origLower = strings.ToLower(orig)
	var tr_string string
	for _, chr := range origLower {
		tr_string += findTranslitChar(string(chr))
	}
	return tr_string
}

func findTranslitChar(chr string) string {
	for k, _ := range trans {
		if chr == string(k) {
			return trans[k]
		}
	}
	return chr
}

func main() {
	args := os.Args

	if len(args) < 2 {
		showHelp(filepath.Base(args[0]))
		return
	}

	trans = makeTranslitArr()
	title_orig := args[1]

	year, month, day := time.Now().Date()
	dateStr := fmt.Sprintf("%d-%02d-%02d", year, month, day)

	postName := dateStr + "-" + toTranslit(title_orig) + ".markdown"

	log.Println("Post name: " + postName)
}
