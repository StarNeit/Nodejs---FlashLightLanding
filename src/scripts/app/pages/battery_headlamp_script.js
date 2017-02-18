(function () {
  'use strict';
  var upsellID = null;
  if (window.location.pathname.indexOf('us_batteryoffer') >= 0) {
    upsellID = 'battery';
    window.myProductId = afGet('pId', 'pId');
  } else if (window.location.pathname.indexOf('us_headlampoffer') >= 0) {
    upsellID = 'headlamp';
  }
  if (upsellID === null) {
    // Not an upsell page
    return;
  }
  var MediaStorage = getOrderData();
  if (typeof MediaStorage.orderId === 'undefined') {
    window.location = 'index.html';
  }
  // Upsell functions
  function doUpsellYes(upsellID, productId) {
    $('div#js-div-loading-bar').show();
    var usParams = {};
    if (MediaStorage.orderId) {
      usParams.orderId = MediaStorage.orderId;
      usParams.productQty = 1;
      switch (upsellID) {
      case 'headlamp':
        productId = productId || '31';
        break;
      case 'battery':
        productId = productId || '11';
        break;
      default:
        break;
      }
      if (productId) {
        usParams.productId = productId;
        var nextPage = 'receipt.html?orderId=' + MediaStorage.orderId;
        if (upsellID === 'battery') {
          nextPage = 'us_headlampoffer.html?orderId=' + MediaStorage.orderId;
        }
        callAPI('upsell', usParams, 'POST', function (e) {
          var json = getJson(e);
          if (json.success) {
            window.location = nextPage;
          } else {
            if (json.message) {
              var messageOut = '';
              if (typeof json.message === 'string') {
                messageOut = json.message;
                if (messageOut === 'This upsale was already taken.') {
                  // continue down the funnel if the upsell is done
                  window.location = nextPage;
                  return;
                }
              } else {
                for (var k in json.message) {
                  if (json.message.hasOwnProperty(k)) {
                    messageOut += k + ':' + json.message[k] + '&lt;br&gt;';
                  }
                }
              }
              bootstrapModal(messageOut, 'Problem with your Addon');
            }
          }
          $('div#js-div-loading-bar').hide();
        });
      }
    } else {
      bootstrapModal('There was an error finding your order, please refresh the page and try again.', 'Error');
      $('div#js-div-loading-bar').hide();
    }
  }
  function doUpsellNo(upsellID) {
    $('div#js-div-loading-bar').show();
    var nextPage = 'receipt.html?orderId=' + MediaStorage.orderId;
    if (upsellID === 'battery') {
      nextPage = 'us_headlampoffer.html?orderId=' + MediaStorage.orderId;
    }
    window.location = nextPage;
  }
  $('#upsellNo').click(function (e) {
    doUpsellNo(upsellID);
  });
  $('.doupsellyes').click(function (e) {
    doUpsellYes(upsellID, $(this).data('productid'));
  });
}());