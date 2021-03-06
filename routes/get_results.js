/* eslint-disable */
const express = require('express');
const router = express.Router();
const path = require('path');
const request = require('request-promise');

function createTimePad(series = 10, timeout = 1000) {
  let seriesCounter = 0;
  let delay = 0;

  return () => {
    return new Promise((resolve) => {
      if (--seriesCounter <= 0) {
        delay += timeout;
        seriesCounter = series;
      }

      setTimeout(resolve, delay);
    });
  };
}

function burrowMatches(outputs, hardCodedPlayers) {
  const relevantPlayers = [];
  outputs.forEach((output) => {
  const rounds = output.statistics.games
  rounds.forEach((round) => {
    round.teams.forEach((team) => {
      team.players.forEach((player) => {
        if (hardCodedPlayers.includes(player.nickname)) {
          relevantPlayers.push(player)
        }
      })
    });
  });
})
  return relevantPlayers
}


module.exports = (knex) => {

  router.get('/getresults', (req, res) => {
    const timePad = createTimePad(1, 10e2);
    knex.select('apiMatchId').from('matches').then((matches) => {
      console.log(matches[0].apiMatchId)
      const ps = [];
      for (let i = 0; i < matches.length; i ++) {
        const match_details = {
            uri: `http://api.sportradar.us/dota2-t1/en/matches/${matches[i].apiMatchId}/summary.json?api_key=${process.env.SPORT_TRADER_KEY}`,
            json: true
          };
          ps.push(timePad().then(() => request(match_details)));
      }
      return Promise.all(ps)
      .then((outcomes) => {

        outcomes.forEach((outcome) => {
          console.log(outcome.sport_event_status.home_score)
          knex('matches').where('apiMatchId', outcome.sport_event.id)
          .update({teamOneScore: outcome.sport_event_status.home_score,
                   teamTwoScore: outcome.sport_event_status.away_score
                 }).then((count) => { console.log(count)})

        })
        res.send('cool beans')
      })
    })



/*
    request.get({
      uri: `http://api.sportradar.us/dota2-t1/en/tournaments/sr:tournament:13911/schedule.json?api_key=${process.env.SPORT_TRADER_KEY}`
    })
      .then((response) => {
        const matches = [];
        const JSONresponse = JSON.parse(response);
        const DateCheck = new RegExp('2017-08-03');
        JSONresponse['sport_events'].forEach((event) => {
          if (event.tournament_round.group === 'A' && DateCheck.test(event.scheduled)) {
            matches.push(event.id)
          }
        });

        let ps = [];
        for (let i = 0; i < matches.length; i++) {
          const match_details = {
            uri: `http://api.sportradar.us/dota2-t1/en/matches/${matches[i]}/summary.json?api_key=${process.env.SPORT_TRADER_KEY}`,
            json: true
          };
          ps.push(timePad().then(() => request(match_details)));
        }
        return Promise.all(ps)
          .then((outputs) => {
            res.send(JSON.stringify(burrowMatches(outputs, hardCodedPlayers)))
          });


      });

  });
*/
})
  return router;
}
