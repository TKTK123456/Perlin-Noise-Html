'use strict';

let zengine = {
  render: function(world, cam, canvas, wireframe, horizon, light) {
    let ctx3D = canvas.getContext('2d');
    ctx3D.clearRect(0, 0, canvas.width, canvas.height);

    //create cartesian unit vector representations from polar light and cam vects
    let cam_vect = this.polar_to_cart(this.to_rad(cam.yaw), this.to_rad(cam.pitch));
    let light_vect = light ? this.polar_to_cart(this.to_rad(light.yaw), this.to_rad(light.pitch)) : 0;

    //temporary inclusion until all current uses are updated to include unit vects
    let has_vects = world[0].vect != undefined;

    //add some extra attrs. to each face
    for (var f = 0; f < world.length; f++) {
      world[f].centr = this.centroid(world[f].verts);
      world[f].dist = this.distance(cam, world[f].centr);
      world[f].c_vect = {
        x: (world[f].centr.x - cam.x) / world[f].dist,
        y: (world[f].centr.y - cam.y) / world[f].dist,
        z: (world[f].centr.z - cam.z) / world[f].dist
      };
    }

    //only keep faces that are:
    // - before the horizon
    // - facing the camera
    // - have at least one vertex in front of camera.
    world = world.filter(f =>
      (!horizon || f.dist < horizon) &&
      (wireframe || !has_vects || this.dot_prod(f.c_vect, f.vect) < 0) &&
      f.verts.some(c => this.dot_prod({
        x: c.x - cam.x,
        y: c.y - cam.y,
        z: c.z - cam.z
      }, cam_vect) > 0));

    //order the faces in the world (furthest to closest)
    if (!wireframe) world.sort((a, b) => b.dist - a.dist);

    for (let f = 0; f < world.length; f++) {
      //todo: just have more stacked .map calls rather than chunk it

      //align 3d coordinates to camera view angle
      let acs = world[f].verts.map(this.translate(-cam.x, -cam.y, -cam.z))
        .map(this.z_axis_rotate(this.to_rad(cam.yaw)))
        .map(this.y_axis_rotate(this.to_rad(cam.roll)))
        .map(this.x_axis_rotate(this.to_rad(cam.pitch)))
        .map(this.translate(cam.x, cam.y, cam.z));

      //convert the 3d coordinates to yaw, pitch angles from cam center line
      let cas = acs.map(c => ({
        y: this.to_deg(Math.atan2(c.x - cam.x, c.y - cam.y)),
        p: this.to_deg(Math.atan2(c.z - cam.z, c.y - cam.y))
      }));

      //convert angles to 2d canvas coordinates
      let cos = cas.map(a => ({
        x: canvas.width / 2 + (a.y * (canvas.width / cam.fov)),
        y: canvas.height / 2 - (a.p * (canvas.width / cam.fov))
      }));

      //draw the face on the canvas
      ctx3D.strokeStyle = wireframe ? 'white' : 'black';
      ctx3D.beginPath();
      ctx3D.moveTo(cos[0].x, cos[0].y);
      for (let i = 1; i < cos.length; i++) {
        ctx3D.lineTo(cos[i].x, cos[i].y);
      }
      ctx3D.closePath(); ctx3D.stroke();
      if (!wireframe) {
        if (has_vects) {
          let angle = -this.dot_prod(light_vect || world[f].c_vect /*cam_vect*/, world[f].vect);
          if (angle < 0) angle = 0;
          let s = world[f].col.s * (light ? (light.min_saturation + (1 - light.min_saturation) * angle) : angle);
          let l = world[f].col.l * (light ? (light.min_lightness + (1 - light.min_lightness) * angle) : angle);
          ctx3D.fillStyle = 'hsl(' + world[f].col.h + ',' + s + '%,' + l + '%)';
        } else {
          ctx3D.fillStyle = world[f].col;
        }
        ctx3D.fill();
      }
    }
  },

  centroid: function(verts) {
    let l = verts.length;
    let c = { x: 0, y: 0, z: 0 };
    for (let i = 0; i < l; i++)
      for (let k in c) c[k] += verts[i][k];
    return { x: c.x / l, y: c.y / l, z: c.z / l };
  },

  translate: (x, y, z) => (v => ({ x: v.x + x, y: v.y + y, z: v.z + z })),
  to_deg: (r) => r * (180 / Math.PI),
  to_rad: (d) => d * (Math.PI / 180),
  distance: (c1, c2) => ((c2.x - c1.x) ** 2 + (c2.y - c1.y) ** 2 + (c2.z - c1.z) ** 2) ** 0.5,
  dot_prod: (v1, v2) => v1.x * v2.x + v1.y * v2.y + v1.z * v2.z,
  polar_to_cart: (y, p) => ({
    x: Math.sin(y) * Math.cos(p),
    y: Math.cos(y) * Math.cos(p),
    z: Math.sin(p)
  }),
  cross_prod: (v1, v2) => ({
    x: v1.y * v2.z - v1.z * v2.y,
    y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x
  }),
  x_axis_rotate: (r) => (v => ({
    x: v.x,
    y: v.y * Math.cos(r) + v.z * Math.sin(r),
    z: -v.y * Math.sin(r) + v.z * Math.cos(r)
  })),
  y_axis_rotate: (r) => (v => ({
    x: v.x * Math.cos(r) + v.z * Math.sin(r),
    y: v.y,
    z: -v.x * Math.sin(r) + v.z * Math.cos(r)
  })),
  z_axis_rotate: (r) => (v => ({
    x: v.x * Math.cos(r) - v.y * Math.sin(r),
    y: v.x * Math.sin(r) + v.y * Math.cos(r),
    z: v.z
  }))
};
let cam = {
  yaw: 0,
  pitch: -30,
  roll: 0,
  fov: 80
};
let light = {
  yaw: 30,
  pitch: -20,
  yaw_speed: 0,
  pitch_speed: 0,
  min_saturation: 0,
  min_lightness: 0.2
};
let hill_height = 8;
let cells = 2
let grid = { width: 32, length: 32 };
let cnvs3D = document.getElementById('cnvs3D');
let heights;
let row_shift;
let col = { h: 0, s: 0, l: 100 };
let cube = [{ verts: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: 1, z: 1 }, { x: 0, y: 0, z: 1 }], col: col, vect: { x: -1, y: 0, z: 0 } },
{ verts: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 1, y: 0, z: 1 }, { x: 0, y: 0, z: 1 }], col: col, vect: { x: 0, y: -1, z: 0 } },
{ verts: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 0, y: 1, z: 0 }], col: col, vect: { x: 0, y: 0, z: -1 } },
{ verts: [{ x: 1, y: 0, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 1, y: 1, z: 1 }, { x: 1, y: 0, z: 1 }], col: col, vect: { x: 1, y: 0, z: 0 } },
{ verts: [{ x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 1, y: 1, z: 1 }, { x: 0, y: 1, z: 1 }], col: col, vect: { x: 0, y: 1, z: 0 } },
{ verts: [{ x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 1 }, { x: 1, y: 1, z: 1 }, { x: 0, y: 1, z: 1 }], col: col, vect: { x: 0, y: 0, z: 1 } }];
let ctx3D = cnvs3D.getContext('2d');
cnvs3D.width = 1000;
cnvs3D.height = 712;
function get_row(ind) {
  let row = [];
  for (let c = 0; c < grid.width + 1; c++) {
    row.push(perlin.get(c * (cells / Math.min(grid.width, grid.length)),
      ind * (cells / Math.min(grid.width, grid.length))) * hill_height);
  }
  return row;
}
function init() {
  perlin.seed();
  heights = [];
  for (row_shift = 0; row_shift < grid.length + 1; row_shift++) {
    heights.push(get_row(row_shift));
  }
  cam.x = grid.width / 2;
  cam.y = -20;
  cam.z = 20;
}
function gen_world() {
  let world = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid.width; c++) {
      //hue is just a scaled version of the height of this triangle for its colour
      let hue = parseInt((heights[r][c] / hill_height) * 360 + 180);
      let hsl = { h: hue, s: 50, l: 40 };
      /* format for tile (two triangles):
       *   [2] (c,r+1) *---* (c+1,r+1) [3]
       *               | \ |
       *   [0]   (c,r) *---* (c+1,r)   [1]
       */
      let vs = [{ x: c, y: r, z: heights[r][c] },
      { x: c + 1, y: r, z: heights[r][c + 1] },
      { x: c, y: r + 1, z: heights[r + 1][c] },
      { x: c + 1, y: r + 1, z: heights[r + 1][c + 1] }];
      //gives vector betweent two points
      let vec = (p1, p2) => ({ x: p2.x - p1.x, y: p2.y - p1.y, z: p2.z - p1.z });
      world.push(
        {
          verts: [vs[0], vs[1], vs[2]],
          vect: zengine.cross_prod(vec(vs[0], vs[1]), vec(vs[0], vs[2])),
          col: hsl
        },
        {
          verts: [vs[1], vs[2], vs[3]],
          vect: zengine.cross_prod(vec(vs[3], vs[2]), vec(vs[3], vs[1])),
          col: hsl
        }
      );
    }
  }
  return world;
}
