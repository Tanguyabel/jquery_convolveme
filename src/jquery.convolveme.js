/*
* Convolve Me - simple jQuery plugin for convolution filtering on images
*
* Copyright(c) 2015   Tanguy Abel
*
* Licensed under the MIT license:
* http://www.opensource.org/licenses/mit-license.php
*
*/

(function( $ ) {
  
  $.fn.convolveMe = function(opts) {    
    
    this.filter("img").each(function() {
    
      this.options = $.extend({}, $.fn.convolveMe.defaultOptions, opts);
      
      this.$image = $(this);
      $.fn.convolveMe.initCanvas(this);
      $.fn.convolveMe.initKernel(this);
      
      // todo: decrease charge of computation (visible parts detection, delayed computation)
      // todo: render with webgl if enabled for faster computation
      $.fn.convolveMe.computeConvolution(this);
      
      var e = this;
      
      if (this.options.permanent) {
        $.fn.convolveMe.displayConvolved(e);
      } else {
        this.$canvas.hover(function() { $.fn.convolveMe.displayConvolved(e) }, function() { $.fn.convolveMe.displayOriginal(e) });
      }
    });
    return this;
  };
  
  // Common kernel: sharpen
  $.fn.convolveMe.kernelSharpen = [
    [0 ,-1, 0],
    [-1 ,5, -1],
    [0 ,-1, 0]
  ]

  // Common kernel: blur
  $.fn.convolveMe.kernelBlur = [
    [1/9, 1/9, 1/9],
    [1/9, 1/9, 1/9],
    [1/9, 1/9, 1/9]
  ]
  
  // Common kernel: blur
  $.fn.convolveMe.kernelSimple = [
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
  ]
  
  // Common kernel: emboss
  $.fn.convolveMe.kernelEmboss = [
    [-2, -1, 0],
    [-1, 1, 1],
    [0, 1, 2]
  ]
  
  // Defaults options for the plugin
  $.fn.convolveMe.defaultOptions = {
    kernel: $.fn.convolveMe.kernelSimple, // the kernel to use for convolution
    permanent: true,                      // transformed always if true, on mouse over if false
    // todo: edge handling
  };
  
  // Init the kernel from the matrix set as an option
  $.fn.convolveMe.initKernel = function(e) {
    e.kernel = e.options.kernel;
    e.kernel.radius = Math.floor(e.kernel.length / 2);
  }
  
  // Creates canvas from the image and insert in the page instead of the
  // original image
  $.fn.convolveMe.initCanvas = function(e) {

      // retrieve dimensions of the original image
      e.width = e.$image.width();
      e.height = e.$image.height();
      
      // create the canvas element with correct dimensions
      e.$canvas = $('<canvas>').attr({
        width: e.width,
        height: e.height
      });
      
      // retrieve the 2d context of the canvas
      e.context = e.$canvas.get(0).getContext("2d");
      
      // draw the original image on the canvas so we can process it later
      e.context.drawImage(e.$image.get(0), 0, 0, e.width, e.height);
      
      // store a deep copy of the original image data
      var imageData = e.context.getImageData(0, 0, e.width, e.height)
      e.originalImageData = e.context.createImageData(e.width, e.height);
      for (var i = 0; i < imageData.data.length; ++i) {
        e.originalImageData.data[i] = imageData.data[i];
      }
      
      // insert the canvas in the page and delete the original image
      e.$image.after(e.$canvas);
      e.$image.detach();
  };
  
  // Compute the convolution and store result in e.convolvedImageData
  $.fn.convolveMe.computeConvolution = function(e) {
    
    // reference to original data
    var data = e.originalImageData.data;
    
    // new image after computation
    e.convolvedImageData = e.context.createImageData(e.width, e.height);
    
    // run convolution using the defined kernel <<
    for (var i = e.kernel.radius; i < e.height - e.kernel.radius; ++i) {
      for (var j = e.kernel.radius; j < e.width - e.kernel.radius; ++j) {

        // apply kernel to current pixel <<
        var currentColor = [0, 0, 0, 0]; // rgba color
          for (k = -e.kernel.radius; k <= e.kernel.radius; ++k) {
            for (l = -e.kernel.radius; l <= e.kernel.radius; ++l) {
              
              // index of the current pixel
              var currentIndex = 4 * ((i+k) * e.width + (j+l));
              currentColor[0] += data[currentIndex + 0] * e.kernel[k + e.kernel.radius][l + e.kernel.radius];
              currentColor[1] += data[currentIndex + 1] * e.kernel[k + e.kernel.radius][l + e.kernel.radius];
              currentColor[2] += data[currentIndex + 2] * e.kernel[k + e.kernel.radius][l + e.kernel.radius];
              currentColor[3] += data[currentIndex + 3] * e.kernel[k + e.kernel.radius][l + e.kernel.radius];
            }
          }
          // >> apply kernel to current pixel
          
        // store computed pixel in the new image
        e.convolvedImageData.data[4 * (i * e.width + j) + 0] = currentColor[0];
        e.convolvedImageData.data[4 * (i * e.width + j) + 1] = currentColor[1];
        e.convolvedImageData.data[4 * (i * e.width + j) + 2] = currentColor[2];
        e.convolvedImageData.data[4 * (i * e.width + j) + 3] = 255;
      }
    }
    // >> run convolution using the defined kernel
  };
  
  // Display the original image
  $.fn.convolveMe.displayOriginal = function(e) {
    e.context.putImageData(e.originalImageData, 0, 0);
  };
  
  // Display the convolved image
   $.fn.convolveMe.displayConvolved = function(e) {
    e.context.putImageData(e.convolvedImageData, 0, 0);
  };
  
}(jQuery));
