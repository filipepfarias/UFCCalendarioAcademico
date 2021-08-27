const ics = require('ics')
const rp = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');

const express = require('express');
const router = express.Router();

const options = {
    uri: 'https://www.ufc.br/calendario-universitario/2021',
    transform: function (body) {
        return cheerio.load(body)
    }
}

router.get('/', async function(request, response, next) {
  const events = await resquestExternal(filters);

  ics.createEvents(events, (error, generetedIcs) => {
    if (error) console.log(error);

    response.status(200)
    .attachment(`calendar.ics`)
    .send(generetedIcs)
  });
});

router.get('/filters/(:arr)*', async function(request, response, next) {
  const filters = (request.params.arr).concat(request.params[0]).split('/');
  const events = await resquestExternal(filters);

  ics.createEvents(events, (error, generetedIcs) => {
    if (error) console.log(error);

    response.status(200)
    .attachment(`calendar.ics`)
    .send(generetedIcs)
  });
});

router.get('/json', async function(request, response, next) {
  const events = await resquestExternal();

  response.json({ 
    created_at: new Date(),
    targetURL: options.uri,
    events
  });
});

router.get('/ics', async function(request, response, next) {
  const events = await resquestExternal();

  ics.createEvents(events, (error, generetedIcs) => {
    if (error) console.log(error);

    response.send(generetedIcs)
  });
});


async function resquestExternal(filters) {
  return rp(options).then(($) => {
    const events = [];
    const titles = [];

    $('.c-calendarios').each((i, elem) => {
      $(elem).find('h3').map((i, title) => {
          titles.push(`${$(title).text().split(' ')[0]}/${$(title).text().split(' ')[2]}`)
      });

      $(elem).find('.category').map((i, table) => {
          const monthYear  = titles[i];
          const monthNames = [ 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro' ];

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
                    calName: 'Calendário Acadêmico',
                    title: description,
                    start: [parseInt(dateYear),parseInt(dateMonth),parseInt(dateDayStart)],
                    end: [parseInt(dateYear),parseInt(dateMonth),parseInt(dateDayEnd)]
                  })    
              }
          });
      });
    });

    if(filters.length > 0) {
      console.log('filtrado', filters);
      return events.filter(e => filters.some(f => e.title.includes(f)))
    }

    return events;
  });
}


module.exports = router;
