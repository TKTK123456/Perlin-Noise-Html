const engine3D = {
  translate: (x, y, z) => (v => ({x: v.x + x, y: v.y + y, z: v.z + z})),
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
      let v = point(vert, cW/2, cH/2);
      context.fillStyle = color;
      context.fillRect(v.x, v.y, width, height);
  }
}