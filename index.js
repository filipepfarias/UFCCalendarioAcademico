const { title } = require('process');
const ics = require('ics')
const rp = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');
var express = require('express');
var app = express();

const PORT = process.env.PORT || 3000;

const options = {
    uri: 'https://www.ufc.br/calendario-universitario/2021',
    transform: function (body) {
        return cheerio.load(body)
    }
}

rp(options)
    .then(($) => {        
        const events = [];
        const titles = [];
        const filters = ['matrícula', 'graduação','semestre','Feriado Municipal','período','disciplina','facultativo'];
        $('.c-calendarios').each((i, elem) => {
            $(elem).find('h3').map((i, title) => {
                titles.push(`${$(title).text().split(' ')[0]}/${$(title).text().split(' ')[2]}`)
            });

            $(elem).find('.category').map((i, table) => {
                const monthYear  = titles[i];

                const monthNames = [
                    'Janeiro',
                    'Fevereiro',
                    'Março',
                    'Abril',
                    'Maio',
                    'Junho',
                    'Julho',
                    'Agosto',
                    'Setembro',
                    'Outubro',
                    'Novembro',
                    'Dezembro'
                ];
 
                let description = null;
                $(table).find('td').map((i, item) => {
                    const td = $(item).text();
                    if(i % 2 == 0) {
                        dateMonth = String(monthNames.indexOf(monthYear.split('/')[0])+1).padStart(2, '0');
                        dateYear = monthYear.split('/')[1]
                        dateMonthYear = `${dateMonth}/${dateYear}`;

                        if(td.match(/ a | e /)){
                            dateDayEnd = (td.split(' ')[2]).replace(/\D/g, "");
                            dateDayStart = (td.split(' ')[0]).replace(/\D/g, "");
                        } else {
                            dateDayStart = td.replace(/\D/g, "");
                            dateDayEnd = dateDayStart;
                        };
                    } else {
                        description = td;
                        events.push({
                            start: [parseInt(dateYear),parseInt(dateMonth),parseInt(dateDayStart)],
                            end: [parseInt(dateYear),parseInt(dateMonth),parseInt(dateDayEnd)],
                            title: description
                        })    
                    }
                });
            });
            // filteredEvents = [];
            // filters.map(f => {
            //     const aux = events.filter(e => e.title.includes(f))
            //     filteredEvents.push(...aux)
            // });
            filteredEvents = events.filter(e => filters.some(f => e.title.includes(f)))

            ics.createEvents(filteredEvents, (error, res) => {
                if (error) {
                  console.log(error)
                }
                fs.writeFileSync(`calendar.ics`, res)
            });

        });
    })
    .catch((err) => {
        console.log(err);
    });

    app.listen(PORT, function() {
        console.log(`Servidor rodando na porta ${PORT}.`);
      });

    app.get('/calendar.ics', function(req, res){
        const file = `${__dirname}/calendar.ics`;
        res.download(file); // Set disposition and send it.
      });