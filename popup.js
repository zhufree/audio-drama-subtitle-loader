const localColor = localStorage.getItem('subtitle-color')
const localSize = localStorage.getItem('subtitle-size')
if (localColor && (localColor.length || localColor.length == 9) && localColor.startsWith('#')) {
  document.getElementById("colorInput").value = localColor
}
if (localSize && parseInt(localSize)) {
  document.getElementById("sizeInput").value = localSize
}
document.getElementById("setFont").onclick = function () {
  // Get the value of the colorInput and sizeInput elements
  const colorValue = document.getElementById("colorInput").value;
  const sizeValue = document.getElementById("sizeInput").value;
  // Set the retrieved values into localStorage
  localStorage.setItem('subtitle-color', colorValue);
  localStorage.setItem('subtitle-size', sizeValue);
  alert('ok!')
}