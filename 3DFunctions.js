'use strict';
const engine3D = {
  translate: (x, y, z) => (v => ({ x: v.x + x, y: v.y + y, z: v.z + z })),
  distance: (c1, c2) => ((c2.x - c1.x) ** 2 + (c2.y - c1.y) ** 2 + (c2.z - c1.z) ** 2) ** 0.5,
  dot_prod: (v1, v2) => v1.x * v2.x + v1.y * v2.y + v1.z * v2.z,
  polar_to_cart: (y, p) => ({
    x: Math.sin(y) * Math.cos(p),
    y: Math.cos(y) * Math.cos(p),
    z: Math.sin(p)
  }),
  to_rad: (d) => d * (Math.PI / 180),
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
  })),
  point: (v, xm, ym) => ({
    x: xm + v.x * (v.focal / (v.z - 230)),
    y: ym + v.y * (v.focal / (v.z - 230)),
    z: 0,
  }),
  drawVert: function(vert, canvas, color, width, height, cW, cH) {
    let context = canvas.getContext('2d');
    let v = this.point(vert, cW / 2, cH / 2);
    context.fillStyle = color;
    context.fillRect(v.x, v.y, width, height);
  },
  render: function(canvas, world, cW, cH, cam) {
    alert("2")
    let context = canvas.getContext('2d');
    context.clearRect(0, 0, cW, cH);
    for (let i = 0; i < world.length; i++) {
      world[i].dist = this.distance(cam, world[i].vert);
      world[i].c_vert = {
        x: (world[i].vert.x - cam.x) / world[i].dist,
        y: (world[i].vert.y - cam.y) / world[i].dist,
        z: (world[i].vert.z - cam.z) / world[i].dist
      };
    }
    alert("3")
    world = world.filter(f =>
      (this.dot_prod(f.c_vect, f.vect) < 0) &&
      f.verts.some(c => ({
        x: c.x - cam.x,
        y: c.y - cam.y,
        z: c.z - cam.z
      }) > 0));
    alert("4")
    for (let i = 0; i < world.length; i++) {
      this.drawVert(world[i].c_vert, canvas, "blue", world[i].width, world[i].height, cW, cH)
    }
  }
};