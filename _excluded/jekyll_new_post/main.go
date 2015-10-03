package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
	"text/template"
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

func readConfig() (map[string]interface{}, error) {
	file, err := ioutil.ReadFile("config_go.json")
	if err != nil {
		return nil, err
	}
	var parsed interface{}
	err = json.Unmarshal(file, &parsed)
	config := parsed.(map[string]interface{})

	return config, err
}

func findTranslitChar(chr string) string {
	for k, _ := range trans {
		if chr == string(k) {
			return trans[k]
		}
	}
	return chr
}

type PostParams struct {
	Name string
	Date string
}

func main() {
	args := os.Args

	if len(args) < 2 {
		showHelp(filepath.Base(args[0]))
		return
	}

	trans = makeTranslitArr()
	title_orig := args[1]

	currTime := time.Now()
	year, month, day := currTime.Date()
	dateStr := fmt.Sprintf("%d-%02d-%02d", year, month, day)
	postName := dateStr + "-" + toTranslit(title_orig) + ".markdown"
	dateFull := currTime.Format("2006-01-02 15:04:05 Z0700")

	conf, err := readConfig()
	if err != nil || conf["posts_path"] == nil || conf["editor_path"] == nil {
		conf = map[string]interface{}{
			"posts_path":  "./",
			"editor_path": "notepad",
		}
	}

	// Generating post body from template
	t, err := template.ParseFiles("tmpls_go/new_post.tmpl")
	if err != nil {
		log.Fatal(err)
	}

	file, err := os.Create(conf["posts_path"].(string) + postName)
	if err != nil {
		log.Fatal(err)
	}
	err = t.Execute(file, PostParams{Name: title_orig, Date: dateFull})
	if err != nil {
		log.Fatal(err)
	}
}
