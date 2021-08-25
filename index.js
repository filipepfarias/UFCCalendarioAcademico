
const rp = require('request-promise')
const cheerio = require('cheerio')
const { parse } = require('json2csv');

const options = {
    uri: 'https://www.ufc.br/calendario-universitario/2021',
    transform: function (body) {
        return cheerio.load(body)
    }
}


rp(options)
    .then(($) => {        
        const tables = [];
        const titles = [];
        $('.c-calendarios').each((i, elem) => {
            $(elem).find('h3').map((i, title) => {
                titles.push(`${$(title).text().split(' ')[0]}/${$(title).text().split(' ')[2]}`)
            });

            $(elem).find('.category').map((i, table) => {
                const handleTable = {
                    title: titles[i],
                    content: []
                };

                const dates = [];
                const descriptions = [];
                const tds = [];
                $(table).find('td').map((i, item) => {
                    const td = $(item).text();
                    tds.push(td);
                });

                tds.map((td, i) => {
                    if(i % 2 == 0) {
                        dates.push(td);
                    } else {
                        descriptions.push(td);
                    }
                });
                
                dates.map((date, i) => {
                    handleTable.content.push({
                        date: date,
                        description: descriptions[i] 
                    })  
                })

                tables.push(handleTable);
            });

            console.log(JSON.stringify(tables));
        });
    })
    .catch((err) => {
        console.log(err);
    });
