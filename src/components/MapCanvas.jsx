import { useEffect, useRef, useState } from "react";
import "./Map.css";

import { FileUploader } from "./FileUploader";
import { parse } from "wellknown";

export const MapCanvas = () => {
  const [wktData, setWktData] = useState(null);

  const initialZoom = 1.0;
  const zoomStep = 0.1;
  const [zoom, setZoom] = useState(initialZoom);

  const [isLoading, setIsLoading] = useState(false);

  const [executionTime, setExecutionTime] = useState(0);

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

    //Flip Y illustrate
    const halfCanvasHeight = canvas.height / 2;
    if (y > halfCanvasHeight) {
      y = y - (y - halfCanvasHeight) * 2;
    } else {
      y = y + (halfCanvasHeight - y) * 2;
    }

    return [x, y];
  };

  const drawDataOnCanvas = () => {
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
  };

  //Call everytime wktData and zoom change.
  useEffect(() => {
    if (wktData === null) return;

    const startTime = performance.now();

    console.log(isLoading);

    drawDataOnCanvas();

    const endTime = performance.now();
    const exeTime = endTime - startTime;

    setExecutionTime(exeTime);
    console.log(`Execution Time: ${exeTime.toFixed(2)} ms`);
  }, [wktData, zoom]);

  const handleZoomIn = () => {
    setZoom((prevZoom) => prevZoom + zoomStep);
  };

  const handleZoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom - zoomStep, zoomStep));
  };

  return (
    <div className="container">
      <div className="upper-section">
        <FileUploader setWktData={setWktData} />
        <div className="zoom-group">
          <button onClick={handleZoomIn}>+</button>
          <button onClick={handleZoomOut}>-</button>
        </div>
      </div>
      <p>Execution Time: {executionTime.toFixed(4)} ms</p>
      <canvas ref={canvasRef} height={600} width={600}></canvas>
    </div>
  );
};
