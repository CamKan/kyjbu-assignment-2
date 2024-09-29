// kmeans.js

// Global Variable
let dataPoints = [];
let centroids = [];
let svg = d3.select("#plot");
let width = +svg.attr("width");
let height = +svg.attr("height");
let k = 3;
let initMethod = "random";
let iteration = 0;
let maxIterations = 100;
let converged = false;
let allowClick = false;
let animationInterval = null;

// Initialization data
function generateData() {
  dataPoints = [];
  // Generate randomized data points
  for (let i = 0; i < 300; i++) {
    let x = Math.random() * width;
    let y = Math.random() * height;
    dataPoints.push({ x: x, y: y });
  }
  resetAlgorithm();
}

// Plotting data points and center
function draw() {
  svg.selectAll("*").remove();

  // Plotting data points
  svg
    .selectAll(".point")
    .data(dataPoints)
    .enter()
    .append("circle")
    .attr("class", "point")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", 3)
    .attr("fill", (d) => d.color || "gray");

  // Plotting the center
  svg
    .selectAll(".centroid")
    .data(centroids)
    .enter()
    .append("circle")
    .attr("class", "centroid")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", 10)
    .attr("fill", (d, i) => d3.schemeCategory10[i % 10])
    .attr("stroke", "black")
    .attr("stroke-width", 2);
}

// Initialize the center
function initializeCentroids() {
  centroids = [];
  allowClick = false;
  svg.on("click", null);
  if (initMethod === "random") {
    // Randomly initialize the center
    let indices = d3.shuffle(d3.range(dataPoints.length)).slice(0, k);
    for (let i = 0; i < k; i++) {
      let point = dataPoints[indices[i]];
      centroids.push({ x: point.x, y: point.y });
    }
    draw();
  } else if (initMethod === "farthest") {
    // Furthest point initialization
    let firstIndex = Math.floor(Math.random() * dataPoints.length);
    centroids.push({
      x: dataPoints[firstIndex].x,
      y: dataPoints[firstIndex].y,
    });
    for (let i = 1; i < k; i++) {
      let maxDist = -Infinity;
      let nextCentroid = null;
      dataPoints.forEach((p) => {
        let minDist = Math.min(...centroids.map((c) => distance(p, c)));
        if (minDist > maxDist) {
          maxDist = minDist;
          nextCentroid = { x: p.x, y: p.y };
        }
      });
      centroids.push(nextCentroid);
    }
    draw();
  } else if (initMethod === "kmeans++") {
    // KMeans++ initialization
    let firstIndex = Math.floor(Math.random() * dataPoints.length);
    centroids.push({
      x: dataPoints[firstIndex].x,
      y: dataPoints[firstIndex].y,
    });
    for (let i = 1; i < k; i++) {
      let distances = dataPoints.map((p) => {
        let minDist = Math.min(...centroids.map((c) => distance(p, c)));
        return minDist ** 2;
      });
      let sumDist = d3.sum(distances);
      let probs = distances.map((d) => d / sumDist);
      let cumulativeProbs = [];
      probs.reduce((a, b, i) => (cumulativeProbs[i] = a + b), 0);
      let rand = Math.random();
      for (let j = 0; j < cumulativeProbs.length; j++) {
        if (rand < cumulativeProbs[j]) {
          centroids.push({ x: dataPoints[j].x, y: dataPoints[j].y });
          break;
        }
      }
    }
    draw();
  } else if (initMethod === "manual") {
    // Manual initialization
    centroids = [];
    allowClick = true;
    svg.on("click", function (event) {
      if (allowClick && centroids.length < k) {
        let coords = d3.pointer(event);
        centroids.push({ x: coords[0], y: coords[1] });
        draw();
        if (centroids.length === k) {
          allowClick = false;
          svg.on("click", null);
        }
      }
    });
    draw();
  }
}

// Calculated Distance
function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Assign data points to the nearest center
function assignPoints() {
  dataPoints.forEach((p) => {
    let distances = centroids.map((c) => distance(p, c));
    let minIndex = distances.indexOf(Math.min(...distances));
    p.color = d3.schemeCategory10[minIndex % 10];
  });
}

// Update the center of mass position
function updateCentroids() {
  let moved = false;
  centroids.forEach((c, i) => {
    let assignedPoints = dataPoints.filter(
      (p) => p.color === d3.schemeCategory10[i % 10]
    );
    if (assignedPoints.length > 0) {
      let newX = d3.mean(assignedPoints, (p) => p.x);
      let newY = d3.mean(assignedPoints, (p) => p.y);
      if (distance(c, { x: newX, y: newY }) > 1e-4) {
        moved = true;
      }
      c.x = newX;
      c.y = newY;
    }
  });
  return moved;
}

// Perform an iteration
function step() {
  if (converged) {
    alert("The algorithm is converged");
    return;
  }
  if (iteration >= maxIterations) {
    alert("Has reached the maximum number of iterations");
    return;
  }
  assignPoints();
  let moved = updateCentroids();
  draw();
  iteration++;
  if (!moved) {
    converged = true;
    clearInterval(animationInterval);
    animationInterval = null;
    alert("The algorithm is converged");
  }
}

// Run to convergence, automatically displaying each step
function runToConvergence() {
  if (centroids.length === 0) {
    // Initialize
    initializeCentroids();
    if (initMethod === "manual") {
      if (centroids.length < k) {
        alert(
          "Please first select " +
            k +
            " initial centers by clicking on them in the figure."
        );
        return;
      }
    }
  } else if (initMethod === "manual" && centroids.length < k) {
    alert(
      "Please first select " +
        k +
        " initial centers by clicking on them in the figure."
    );
    return;
  }
  if (animationInterval !== null) {
    return;
  }
  animationInterval = setInterval(() => {
    if (!converged && iteration < maxIterations) {
      step();
    } else {
      clearInterval(animationInterval);
      animationInterval = null;
    }
  }, 500); // Setting the interval between each step
}

// Reset Algorithms
function resetAlgorithm() {
  iteration = 0;
  converged = false;
  centroids = [];
  dataPoints.forEach((p) => delete p.color);
  allowClick = false;
  svg.on("click", null);
  if (animationInterval !== null) {
    clearInterval(animationInterval);
    animationInterval = null;
  }
  draw();
}

// Binding control events
document.getElementById("generate-data").onclick = function () {
  generateData();
};

// document.getElementById("step").onclick = function () {
//   if (centroids.length === 0) {
//     initializeCentroids();
//     if (initMethod === "manual") {
//       if (centroids.length < k) {
//         alert(
//           "Please first select " +
//             k +
//             " initial centers by clicking on them in the figure."
//         );
//         return;
//       }
//     }
//   } else if (initMethod === "manual" && centroids.length < k) {
//     alert(
//       "Please first select " +
//         k +
//         " initial centers by clicking on them in the figure."
//     );
//     return;
//   }
//   step();
// };
document.getElementById("step").onclick = function () {
  k = parseInt(document.getElementById("cluster-count").value);
  if (centroids.length !== k) {
    initializeCentroids();
  }

  if (centroids.length === 0) {
    initializeCentroids();
    if (initMethod === "manual") {
      if (centroids.length < k) {
        alert(
          "Please first select " +
            k +
            " initial centers by clicking on them in the figure."
        );
        return;
      }
    }
  } else if (initMethod === "manual" && centroids.length < k) {
    alert(
      "Please first select " +
        k +
        " initial centers by clicking on them in the figure."
    );
    return;
  }
  step();
};

document.getElementById("run").onclick = function () {
  // Get user-selected initialization method and k-value
  k = parseInt(document.getElementById("cluster-count").value);
  initMethod = document.getElementById("init-method").value;

  if (centroids.length === 0) {
    initializeCentroids();
    if (initMethod === "manual") {
      if (centroids.length < k) {
        alert(
          "Please first select " +
            k +
            " initial centers by clicking on them in the figure."
        );
        return;
      }
    }
  } else if (initMethod === "manual" && centroids.length < k) {
    alert(
      "Please first select " +
        k +
        " initial centers by clicking on them in the figure."
    );
    return;
  }
  runToConvergence();
};

document.getElementById("reset").onclick = function () {
  resetAlgorithm();
};

document.getElementById("init-method").onchange = function () {
  // Resets the algorithm when the user changes the initialization method and allows the user to reselect the center
  resetAlgorithm();
  initMethod = document.getElementById("init-method").value;
  if (initMethod === "manual") {
    k = parseInt(document.getElementById("cluster-count").value);
    initializeCentroids();
  }
};

document.getElementById("cluster-count").onchange = function () {
  // Reset the algorithm when the user changes the value of k
  resetAlgorithm();
};

generateData();
draw();
