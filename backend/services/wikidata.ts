import * as cheerio from 'cheerio';
import type { WikipediaContent } from '../types/wikiTypes.js';

export async function fetchWikiData( articleTitle: string ) {
    const encoded = encodeURIComponent(articleTitle);
    const response = await fetch( `https://en.wikipedia.org/w/api.php?action=parse&page=${encoded}&format=json&prop=text|sections`, {
        headers: {
            "User-Agent": "WikiChat/1.0 (abhinavchandramain@gmail.com)"
        }
    });

    const data = await response.json();
    return data;
}

export function parseWikiText(htmlContent: string, title: string): WikipediaContent {
    const $ = cheerio.load(htmlContent);
    $('.infobox').remove();
    $('.navbox').remove();
    $('.references').remove();
    $('.mw-editsection').remove();
    $('sup.reference').remove();
    $('style').remove();

    const content: WikipediaContent['content'] = [];
    let sectionId = 0;
    
    const mainContent = $('.mw-parser-output');
    const elements = mainContent.children().toArray();

    let currentSection = {
        id: sectionId++,
        heading: "Introduction",
        headingContent: ""
    };

    for(let i = 0; i < elements.length; i++){
        const $el = $(elements[i]);

        if($el.is('h1, h2, h3, h4, h5, h6')){
            if(currentSection.headingContent.trim()) {
                content.push(currentSection);
            }

            currentSection = {
                id: sectionId++,
                heading: $el.text(),
                headingContent: ""
            };
        } else if ($el.is('p')){
            currentSection.headingContent += $el.text() + " ";
        }
    }

    if(currentSection.headingContent.trim()) {
        content.push(currentSection);
    }

    return { 
        title,
        content,
        images: []
    };
}

async function test() {
    const result = await fetchWikiData("India");
    const parsed = parseWikiText(result.parse.text['*'], result.parse.title); 
    console.log(parsed);
}
test();