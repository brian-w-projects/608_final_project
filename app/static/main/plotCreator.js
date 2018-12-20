(function($, window, document){

    //Select Limitation
    let lastValidSelection = null;
    let $metroRemaining = $('#metro-remaining');
    let MAXSELECTIONS = 6;
    let $submit = $('#submit');

    let filteredData = null;

    $('#metro-select').change(function(event) {
        let length = $(this).val().length;
        if (length > MAXSELECTIONS) {
          $(this).val(lastValidSelection);
        } else {
          lastValidSelection = $(this).val();
          $metroRemaining.text(MAXSELECTIONS - length);
        }
        if(length === 0){
            $submit.prop('disabled', true);
        }else{
            $submit.prop('disabled', false);
        }
    });


    //Filter Select
    $("#metro-filter").on('change keyup', function(event){
        let filterText = $(this).val().toUpperCase().split(', ');
        $('option').each(function(){
            $(this).show();
            for(let filter in filterText){
                if($(this).text().toUpperCase().indexOf(filterText[filter]) < 0){
                    $(this).hide();
                    break;
                }
            }
        });
    });


    //AJAX Query
    $submit.on('click', function(e){
        NProgress.start();
       e.preventDefault();
       $.ajax({
            type: 'GET',
            url: "/metro",
            data: {'metros': JSON.stringify($('#metro-select').val())},
            dataType: 'json',
            success: function(input){
                displayPlot(input['line']);
                displayCircle(input['circle']);
                displayMap(input['line']);
                $('#year-slider').slider('enable');
                NProgress.done();
            }
        });
    });

    //Time Transition
    $('#year-slider').on('change', function(){
        let newYear = $(this).val();
        for(let ele in filteredData) {
            if(ele.split('-')[1] !== newYear){
                $('#'+ele).parent().hide();
            }else{
                $('#'+ele).parent().show();
            }
        }
    });

    function displayMap(input){
        mapData = _.groupBy(input, 'sort_by');
        let lat = [];
        let lon = [];
        let size = [];
        let name = [];
        for(let ele in mapData){
            lat.push(mapData[ele][0]['lat']);
            lon.push(mapData[ele][0]['lon']);
            size.push(Math.log(mapData[ele][0]['population']));
            name.push(ele + ' ' + mapData[ele][0]['population'].toLocaleString());
        }

        let data =[{
            type:'scattergeo',
            locationmode: 'USA-states',
            lat: lat,
            lon: lon,
            hoverinfo: 'text',
            text: name,
            marker: {
                size: size,
                line: {
                    color: 'black',
                    width: 2
                }
            }
        }];

        let layout = {
            title: '',
            showlegend: false,
            geo: {
                scope: 'usa',
                projection: {
                    type: 'albers usa'
                },
                showland: true,
                landcolor: 'rgb(217, 217, 217)',
                subunitwidth: 1,
                countrywidth: 1,
                subunitcolor: 'rgb(255,255,255)',
                countrycolor: 'rgb(255,255,255)'
            },
        };

        Plotly.newPlot(document.getElementById('map'), data, layout, {showLink: false});
    }

    function displayCircle(input){
        let $circlePlots = $('#circle-plots').find('>:first-child');
        let year = $('#year-slider').val();
        filteredData = _.groupBy(input, 'sort_by');
        $circlePlots.empty();

        for(let ele in filteredData) {
            $circlePlots.append('<div class="col-4"><div id="'+ele+'"></div></div>');
            let data = [{
                values: _.map(filteredData[ele], function (d) {
                            return d.population;
                        }),
                labels: _.map(filteredData[ele], function (d) {
                            return d.county;
                        }),
                hoverinfo: "label+percent+value",
                hole: .4,
                type: "pie"
            }];
            let layout = {
                title: filteredData[ele][0]['metro']
            };
            Plotly.newPlot(document.getElementById(ele), data, layout);

            if(ele.split('-')[1] !== year){
                $('#'+ele).parent().hide();
            }
        }
    }


    function displayPlot(input){
        let lineData = _.groupBy(input, 'sort_by');
        let data = [];
        let labelData = [];
        for(let ele in lineData){
            xData = _.map(lineData[ele], function(d){ return d.year});
            yData = _.map(lineData[ele], function(d){ return d.population});
            data.push({
                x: xData,
                y: yData,
                type: 'scatter',
                mode: 'lines+markers',
                marker:{
                    size: 10
                }
            });
            data.push({
                x: [xData[0], xData[xData.length-1]],
                y: [yData[0], yData[yData.length-1]],
                type: 'scatter',
                mode: 'markers',
                marker:{
                    color: 'black',
                    size: 14
                }

            });

            labelData.push({
                xref: 'paper',
                x: 0.05,
                y: yData[0],
                xanchor: 'right',
                yanchor: 'middle',
                text: lineData[ele][0]['sort_by'].split(/[-,]/)[0] + ' ' + yData[0].toLocaleString(),
                showarrow: false,
                font: {
                    family: 'Arial',
                    size: 16,
                    color: 'black'
                }
            });

            labelData.push({
                xref: 'paper',
                x: 0.95,
                y: yData[yData.length-1],
                xanchor: 'left',
                yanchor: 'middle',
                text: yData[yData.length-1].toLocaleString(),
                font: {
                    family: 'Arial',
                    size: 16,
                    color: 'black'
                },
                showarrow: false
            });

        }

        let layout = {
            showlegend: false,
            margin: {
              l: 100,
              r: 100
            },
            xaxis: {
                showline: true,
                showgrid: false,
                showticklabels: true,
                linecolor: 'rgb(204,204,204)',
                linewidth: 2,
                autotick: false,
                ticks: 'outside',
                tickcolor: 'rgb(204,204,204)',
                tickwidth: 2,
                ticklen: 5,
                tickfont: {
                  family: 'Arial',
                  size: 12,
                  color: 'rgb(82, 82, 82)'
                }
            },
            yaxis: {
                showgrid: false,
                zeroline: false,
                showline: false,
                showticklabels: false
            },
            annotations: [{
                  xref: 'paper',
                  yref: 'paper',
                  x: 0.0,
                  y: 1.05,
                  xanchor: 'left',
                  yanchor: 'bottom',
                  text: 'Population Change by Metro Area',
                  font:{
                    family: 'Arial',
                    size: 30,
                    color: 'rgb(37,37,37)'
                  },
                  showarrow: false
            }]
        };

        layout.annotations = $.extend(layout.annotations, labelData);
        Plotly.newPlot(document.getElementById('viz'), data, layout);
    }
}(window.jQuery, window, document));
