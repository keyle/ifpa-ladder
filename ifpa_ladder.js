"use strict";

var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var program = require('commander');

program
    .version('1.0.0')
    .option('-d, --debug', 'Show debugging info')
    .option('-t, --testing', 'Always output even if there are no changes in top100')
    .parse(process.argv);

function load() {
    request('https://www.ifpapinball.com/rankings/country.php?country=7', (err, res, html) => { // live
    //request('http://localhost:8080/country.html', (err, res, html) => { // testing
        if (err || res.statusCode != 200) {
            console.log('error calling webserver:');
            console.log(JSON.stringify(err));
            return;
        }

        var $ = cheerio.load(html, { ignoreWhitespace: true });
        var file_data = '';

        $('#content table:nth-of-type(3) tr').each((i, el) => {
            const rankth = $(el).find('td').eq(0).text();
            const name = $(el).find('td').eq(1).text().trim();
            const lnk = $(el).find('td a').attr('href');
            const id = lnk ? lnk.split('p=')[1] : '';
            const point = $(el).find('td').eq(4).text();

            if (rankth)
                file_data += 'rank' + '|' + name + '|' + i + '|' + rankth + '|' + id + '\r\n';
        });

        if (program.debug)
            console.log('Writing to file...');
        fs.writeFileSync('data\\rankings.txt', file_data);

        exec('git commit -a -m "changes"', { cwd: './data' }, (err, stdout, stderr) => {
            if (stdout.indexOf('nothing to commit') != -1) {
                if (program.debug) {
                    console.log(stdout);
                    console.log('No changes in the Top 100');
                }

                if (program.testing)
                    show_changes_if_any(); // always show changes in testing
            } else {
                if (program.debug) {
                    console.log(stdout);
                    console.log('There is change in top 100!');

                }
                show_changes_if_any();
            }
        });
    });
}

function show_changes_if_any() {
    exec('git log -p -1 -U0', { cwd: './data' }, (err, stdout, stderr) => {
        const lines = stdout.split('\n');
        const clean = lines.filter(function (e) { return e.indexOf('rank') == 1 });
        if (program.debug)
            console.log('stdout: ' + clean.join('\n'));

        var people = {}; // dictionary of people

        clean.forEach(function (line, i) {
            const data = line.split('|');
            const change = data[0]; // -rank or +rank
            const name = data[1]; // "Joe Blogs"
            const key = data[1].replace(' ', '_'); // "Joe_Blogs"
            const rank = data[2]; // "12"
            const rankth = data[3]; // "12th"
            const id = data[4]; // "40145"

            people[key] = people[key] || {}; // don't override ;P
            people[key].name = name;
            people[key].rankth = rankth;
            people[key].id = id;

            if (change == "-rank") {
                people[key].was = rank; // -rank ... was 12th
            } else {
                people[key].now = rank; // +rank ... is now 12th
            }

            if (people[key].now && people[key].was) {
                const now = parseInt(people[key].now);
                const was = parseInt(people[key].was);

                if (now < was) { // now < was, we're going up!
                    people[key].move = "+" + (was - now);
                } else {
                    people[key].move = "-" + (now - was);

                }
                people[key].move_n = was - now;
            }
        });

        show_difference_in(people);
    });
}

function show_difference_in(people) {
    var stdout = ":flip: The following changes occured in the <https://www.ifpapinball.com/rankings/country.php?country=7|IFPA AUS Top 100>: :flag-au:\r\n";
    var has_something_to_say = false;

    for (var k in people) {
        const person = people[k];

        if (person.move_n > 0) {
            has_something_to_say = true;
            stdout += ":trophy: <https://www.ifpapinball.com/player.php?p=" + person.id + "|" + person.name + ">" + " is now " + person.rankth + " (" + person.move + ")";
        }

        if (person.move_n > 0 && person.move_n < 5)
            stdout += " :arrow_up:\r\n";

        if (person.move_n >= 5 && person.move_n < 15)
            stdout += " :arrow_double_up: :fire:\r\n";
        
        if (person.move_n >= 15)
            stdout += " :fire: :fire: :fire_engine: :hellyeah: :middle_finger:\r\n";
    }

    if (has_something_to_say)
        console.log(stdout);

}

load();