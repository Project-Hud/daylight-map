(function () {

  var wHeight = $(window).height()
    , wWidth = $(window).width()
    , mapTarget = $('#mapTarget')

  /*
   * Original Map Code (C) 2011 g/christensen (gchristnsn@gmail.com)
   * URL: https://github.com/GChristensen/sunligth-world-map-gadget
   */

  function adjustParameters() {
    // How many degrees in one pixel?
      pixelDegW = 360 / wWidth;
      pixelDegH = 180 / wHeight;

    // Offset from 180 deg. of the most left longitude on the map grid
    // in degrees
      edgeOffset = 9.5;

    // Map grid origin
      centerDegW = (wWidth / 2) * pixelDegW - edgeOffset;
      centerDegH = (wHeight / 2) * pixelDegH;
    }

  // Pixel latitude and longitude
  function pixelLambda(x){
      var deg = x * pixelDegW;
      return (deg < centerDegW)
          ? (centerDegW - deg)
          : (360 - deg + centerDegW); // in 360 deg. space
    }

  function pixelPhi(y, lambda){
      return centerDegH - y * pixelDegH;
    }

  function drawDayNightMap(){
      var map = $("<canvas/>", {
            "class":"daylightmap canvas",
            "width": "100%",
            "height": "100%"
        }).appendTo('.item.daylightmap')[0];

      map.width = wWidth;
      map.height = wHeight;
      var ctx = map.getContext("2d");

      $(".item.daylightmap").append("<svg id='map' xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'></svg>");
      var map = d3.select("svg");
      var width = $("svg").parent().width();
      var height = $("svg").parent().height();

      var projection = d3.geo.equirectangular().scale((width/630)*100).translate([width/2, height/2]);
      var path = d3.geo.path().projection(projection);
      var graticule = d3.geo.graticule();

      map.append("path")
          .datum(graticule.outline)
          .attr("class", "background")
          .attr("d", path);

      map.append("g")
          .attr("class", "graticule")
        .selectAll("path")
          .data(graticule.lines)
        .enter().append("path")
          .attr("d", path);

      map.append("path")
          .datum(graticule.outline)
          .attr("class", "foreground")
          .attr("d", path);

      d3.json("javascripts/world-110m.json", function(error, world) {
        map.insert("path", ".graticule")
            .datum(topojson.object(world, world.objects.land))
            .attr("class", "land")
            .attr("d", path);

        map.insert("path", ".graticule")
            .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a.id !== b.id; }))
            .attr("class", "boundary")
            .attr("d", path);
      });
      performCalculations(new Date());
      var northSun = DECsun >= 0;
      var startFrom = northSun ? 0 : (wHeight - 1);
      var pstop = function(y) {
          return northSun ? (y < wHeight) : (y >= 0);
        }
      var inc = northSun ? 1 : -1;
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";

      for(var x = 0; x < wWidth; ++x){
          for(var y = startFrom; pstop(y); y += inc){
              var lambda = pixelLambda(x);
              var phi = pixelPhi(y) + 0.5 * (northSun ? -1 : 1);

              var centralAngle = sind(phi) * sind(DECsun)
                  + cosd(phi) * cosd(DECsun) * cosd(GHAsun - lambda);
              centralAngle = Math.acos(centralAngle);

              if(centralAngle > Math.PI / 2){
                  var rectTop = northSun ? y : 0;
                  var rectHeight = northSun ? wHeight - rectTop : y + 1;

                  ctx.fillRect(x, rectTop, 1, rectHeight);
            break;
          }
        }
      }
    }

  // Render Map
  adjustParameters();
  drawDayNightMap();
})()
