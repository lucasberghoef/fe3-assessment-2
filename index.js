// Chart based on: https://bl.ocks.org/mbostock/3885304
// Data: https://open.data.amsterdam.nl/Tentoonstellingen.csv
// Sorting function based on: https://github.com/cmda-fe3/course-17-18/tree/master/site/class-4/sort

var svg = d3.select("svg"); // I removed the chained variable assignment to make it less prone to human error.
var input = d3.select("input");
var margin = { top: 20, right: 20, bottom: 120, left: 60 }; // Changed bottom margin to allow the titles on the x-axis to be displayed
var width = +svg.attr("width") - margin.left - margin.right;
var height = +svg.attr("height") - margin.top - margin.bottom;

var timeout = d3.timeout(change, 2000); // Automatically starts the animation after two seconds

d3.select('input').on('change', onchange); // Bind the onchange function to changes in the input field

var x = d3.scaleBand().rangeRound([0, width]).padding(0.25); // Changed padding for more room between bars
var y = d3.scaleLinear().rangeRound([height, 0]);

var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var data; // Global variable
const maxTextLength = 20; // Set a maxTextLength variable because I use it more than once

d3.csv("data.csv", function (d) {
    if (d.Locatienaam) {
        if (d.Locatienaam.indexOf('\uFFFD') > -1) {
            d.Locatienaam = d.Locatienaam.replace('\uFFFD', 'ï'); // Find unrecognized character and replace it
        }
        if (d.Locatienaam.length > maxTextLength) {
            d.Locatienaam = `${d.Locatienaam.substring(0, maxTextLength)}...`; // Cut off strings longer than 20 characters and add ellipsis
        }
        return d; // Return the object if it has a 'Locatienaam'
    } else {
        return; // Don't return anything if it hasn't got a 'Locatienaam'
    }
}, function (error, d) {
    if (error) throw error;

    data = d; // Assign the global variable

    data = locations = d3.nest()
        .key(d => d.Locatienaam) // Use the location name as key
        .sortKeys(d3.ascending) // Sort the keys in advance, to ensure rendering is instantly correct
        .entries(d)
        .map(d => ({
            name: d.key,
            values: d.values
        }));

    x.domain(locations.map(function (l) { return l.name; })); // Use the location names on the x axis
    let yRange = d3.extent(locations, function (l) { return l.values.length }); // Use the amount of events per location on the y axis. This sets the range
    yRange[0] = 0; // Alter the range to show all bars. Without this it would start the range at 1
    y.domain(yRange).nice();

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("y", 7)
        .attr("x", 9)
        .attr("dy", ".35em")
        .attr("transform", "rotate(50)") // Rotate the location names for better readability
        .style("text-anchor", "start");

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("fill", "black") // Set a color. Otherwise it would be transparant
        .attr("y", -15)
        .attr("x", 10) // Changed x and y coordinates for more aesthetically pleasing position
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text("Exhibition count"); // Set the text

    g.selectAll(".bar")
        .data(locations)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function (l) { return x(l.name); })
        .attr("y", function (l) { return y(l.values.length); })
        .attr("width", x.bandwidth())
        .attr("height", function (l) { return height - y(l.values.length); });
});


function onchange() {
    var sort = this.checked ? helper.sortOnCount : helper.sortOnName; // Chooses the sort function based on the state of the checkbox
    var x0 = x.domain(data.sort(sort).map(helper.name)).copy();
    var transition = svg.transition(); // Allows me to animate changes to the chart

    timeout.stop(); // Stops the timeout so it won't change my selection

    /* Initial sort */
    svg.selectAll('.bar').sort(sortBar);

    /* Move the bars. */
    transition.selectAll('.bar')
        .delay(delay)
        .attr('x', barX0);

    /* Move the labels. */
    transition.select('.axis--x')
        .call(d3.axisBottom(x))
        .selectAll('g')
        .delay(delay);

    function sortBar(a, b) {
        return x0(helper.name(a)) - x0(helper.name(b));
    }

    function barX0(d) {
        return x0(helper.name(d));
    }

    function delay(d, i) {
        return i * 50;
    }
}

function change() {
    // Used by the timeout to change the value of the input field.
    d3.select('input')
        .property('checked', true)
        .dispatch('change');
}


/* Helper functions. Only perform a single task and returns the result
====================================================================== */
const helper = {

    /* Calculate `x` for a bar. */
    barX: function (d) {
        return x(helper.name(d));
    },

    /* Calculate `y` for a bar. */
    barY: function (d) {
        return y(helper.count(d));
    },

    /* Clean a row. */
    row: function (d) {
        d.frequency = Number(helper.count(d));
        return d;
    },

    /* Sort on frequence. */
    sortOnCount: function (a, b) {
        return helper.count(b) - helper.count(a);
    },

    /* Sort on letters. */
    sortOnName: function (a, b) {
        return d3.ascending(
            helper.name(a),
            helper.name(b)
        );
    },

    /* Get the letter field for a row. */
    name: function (d) {
        return d.name;
    },

    /* Get the frequency field for a row. */
    count: function (d) {
        return d.values.length;
    }

}
