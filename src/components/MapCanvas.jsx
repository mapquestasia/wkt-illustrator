import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "./Map.css";

import { FileUploader } from "./FileUploader";
import { parse } from "wellknown";

export const MapCanvas = () => {
  const [isChecked, setIsChecked] = useState(false);
  const [wktData, setWktData] = useState(null);

  const initialZoom = 1.0;
  const zoomStep = 0.1;
  const [zoom, setZoom] = useState(initialZoom);

  const [isLoading, setIsLoading] = useState(false);

  const canvasRef = useRef(null);

  const findMinMax = (polygons) => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    polygons.forEach((polygonString) => {
      const geometry = parse(polygonString.trim());

      if (geometry === null) return;

      geometry.coordinates[0].forEach(([long, lat]) => {
        minX = Math.min(minX, long);
        minY = Math.min(minY, lat);
        maxX = Math.max(maxX, long);
        maxY = Math.max(maxY, lat);
      });
    });

    console.log({
      minX,
      minY,
      maxX,
      maxY,
      mapWidth: maxX - minX,
      mapHeight: maxY - minY,
    });

    return { minX, minY, maxX, maxY };
  };

  const convertLatLongToCanvasCoords = (lat, long, canvas, minMax) => {
    const mapWidth = minMax.maxX - minMax.minX;
    const mapHeight = minMax.maxY - minMax.minY;

    let scale = 1;

    //Scale to fit perfectly in canvas
    if (mapHeight > mapWidth) scale = canvas.height / mapHeight;
    else scale = canvas.width / mapWidth;

    let x = (lat - minMax.minX) * scale;
    let y = (long - minMax.minY) * scale;

    //FlipY illustrate
    const halfCanvasHeight = canvas.height / 2;
    if (y > halfCanvasHeight) {
      y = y - (y - halfCanvasHeight) * 2;
    } else {
      y = y + (halfCanvasHeight - y) * 2;
    }

    return [x, y];
  };

  //Call everytime wktData change.
  useEffect(() => {
    if (wktData === null) return;

    setIsLoading(true);
    console.log("is loading...");
    console.log(zoom);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height); //Clear canvas

    const polygons = wktData.split("\n"); //Seperate each polygon

    const minMax = findMinMax(polygons); //Find max-min mapwidth & height to use for calculation.

    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.translate(centerX, centerY); // Translate to center of canvas
    ctx.scale(zoom, zoom); // Apply zoom
    ctx.translate(-centerX, -centerY); // Translate back to original position

    polygons.forEach((polygonStr) => {
      const geometry = parse(polygonStr.trim());

      if (geometry === null) return;

      ctx.beginPath();
      geometry.coordinates[0].forEach((point, index) => {
        /* let [x, y] = point;

        if (isChecked) {
          const [lat, long] = point;
          [x, y] = convertLatLongToCanvasCoords(lat, long, canvas, minMax);
        } */

        const [lat, long] = point;
        const [x, y] = convertLatLongToCanvasCoords(lat, long, canvas, minMax);

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();
      ctx.stroke();
    });

    console.log("Finish");
    setIsLoading(false);
  }, [wktData, zoom]);

  const handleZoomIn = () => {
    setZoom((prevZoom) => prevZoom + zoomStep);
  };

  const handleZoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom - zoomStep, zoomStep));
  };

  return (
    <div>
      <FileUploader setWktData={setWktData} />
      {/* <div>
        <label>Convert Lat/Long to X/Y</label>
        <input
          type="checkbox"
          onChange={(e) => setIsChecked(e.target.checked)}
        />
      </div> */}
      {/* <div>
        <button onClick={handleZoomIn}>+</button>
        <button onClick={handleZoomOut}>-</button>
      </div> */}
      {isLoading && <p>Loading ...</p>}
      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        style={{ border: "1px solid red" }}
      ></canvas>
    </div>
  );
};
