package main

import (
	"log"
	"os"
	"strings"
)

var trans map[string]string

func showHelp() {
	log.Printf("\n\nИнструкция: укажите, пожалуйста, заголовок поста в качестве параметра командной сроки. Например:\n\n   ./new_post \"Как я провёл лето\"\n\n")
}

func makeTranslitArr() map[string]string {
	//
	// TODO make it beautiful !   ...in style - "key": "value"
	//
	translit := make(map[string]string)
	translit[" "] = "_"
	translit["а"] = "a"
	translit["б"] = "b"
	translit["в"] = "v"
	translit["г"] = "g"
	translit["д"] = "d"
	translit["е"] = "e"
	translit["ё"] = "yo"
	translit["ж"] = ""
	translit["з"] = "z"
	translit["и"] = "i"
	translit["й"] = "j"
	translit["к"] = "k"
	translit["л"] = "l"
	translit["м"] = "m"
	translit["н"] = "n"
	translit["о"] = "o"
	translit["п"] = "p"
	translit["р"] = "r"
	translit["с"] = "s"
	translit["т"] = "t"
	translit["у"] = "u"
	translit["ф"] = "f"
	translit["х"] = "h"
	translit["ц"] = "c"
	translit["ч"] = "ch"
	translit["ш"] = "sh"
	translit["щ"] = "shh"
	translit["ъ"] = ""
	translit["ы"] = "yu"
	translit["ь"] = ""
	translit["э"] = "e"
	translit["ю"] = "yu"
	translit["я"] = "ya"

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
		showHelp()
		return
	}

	trans = makeTranslitArr()

	title_orig := args[1]
	log.Println("Title translit: " + toTranslit(title_orig))
}
