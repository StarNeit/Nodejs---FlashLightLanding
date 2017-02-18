function init_field_fv(e, data) {
  'use strict';
  var field = data.field,
    $field = data.element,
    bv = data.fv;

  var $span = $('<small/>').addClass('help-block validMessage text-success').attr('data-field', field).insertAfter($field).hide();
  // Retrieve the valid message via getOptions()
  var message = bv.getOptions(field).validMessage;
  if (message) {
    $span.text(message);
  }
}
function success_field_fv(e, data) {
  'use strict';
  var field = data.field,
    $field = data.element;
  $field.next('.validMessage[data-field=\'' + field + '\']').show();
}
function err_field_fv(e, data) {
  'use strict';
  var field = data.field,
    $field = data.element;
  $field.next('.validMessage[data-field=\'' + field + '\']').hide();
}
(function () {
  'use strict';
  $('input[name=phoneNumber]').mask('000-000-0000', {'translation': {0: {pattern: /[0-9*]/}}});
  var MediaStorage = {};
  // Lead create/update
  function createLead(data, callback) {
    var crmLead = {};
    crmLead.firstName = data.FirstName;
    crmLead.lastName = data.LastName;
    crmLead.phoneNumber = data.MobilePhone;
    crmLead.emailAddress = data.Email;

    MediaStorage.firstName = data.FirstName;
    MediaStorage.lastName = data.LastName;
    MediaStorage.phoneNumber = data.MobilePhone;
    MediaStorage.emailAddress = data.Email;

    callAPI('create-lead', crmLead, 'POST', function (resp) {
      if (resp.success) {
        if (resp.orderId) {
          MediaStorage.orderId = resp.orderId;
          localStorage.setItem('orderId', resp.orderId);
        }
      }
      callback(resp.success);
    });
  }
  function updateLead(data, cb) {
    var crmLead = data;
    crmLead.orderId = MediaStorage.orderId;
    crmLead.firstName = MediaStorage.firstName;
    crmLead.lastName = MediaStorage.lastName;
    crmLead.phoneNumber = MediaStorage.phoneNumber;
    crmLead.emailAddress = MediaStorage.emailAddress;
    callAPI('create-lead', crmLead, 'POST', function (e) {
      console.log(e);
      cb();
    });
  }
  // Forms submit
  var submittedContactForm = false;
  // This switches between contact modal & address modal
  function submitContactForm() {
    var data = {};
    var tempData = {};
    tempData.Email = $('[name=email]').val();
    tempData.FirstName = $('[name=contactModalName]').val();
    tempData.MobilePhone = $('[name=phoneNumber]').val();

    data.Email = filterXSS(tempData.Email);
    data.FirstName = filterXSS(tempData.FirstName);
    data.MobilePhone = filterXSS(tempData.MobilePhone);
    data.LastName = 'NA';

    localStorage.setItem('firstName', data.FirstName);
    localStorage.setItem('lastName', data.LastName);
    localStorage.setItem('emailAddress', data.Email);
    localStorage.setItem('phoneNumber', data.MobilePhone);
    $('div#js-div-loading-bar').show();
    callAPI('add-contact', data, 'POST', function (response) {
      if (response.success) {
        createLead(data, function (success) {
          // In case of Mobile devices, show address modal and go to checkout page.
          if (customWrapperForIsMobileDevice()) {
            $('div#js-div-loading-bar').hide();
            $('#modal-contact .close-modal').click();
            $('.btn-address-modal').click();
          } else {
            window.location = 'checkout.html';
          }
        });
      } else {
        $('div#js-div-loading-bar').hide();
      }
    });
  }
  // submit address form
  function submitAddressForm() {
    var addressFormFields = [
      'address1',
      'city',
      'state',
      'postalCode'
    ];
    var tmp = {};
    for (var index = 0; index < addressFormFields.length; index++) {
      var value = addressFormFields[index];
      if ($('[name=' + value + ']').length > 0) {
        var dirty = $('[name=' + value + ']').val();
        var uVal = filterXSS(dirty);
        localStorage.setItem(value, uVal);
        tmp[value] = uVal;
      }
    }    
    //if(evil) return;
    updateLead(tmp, function () {
      window.location = 'checkout.html';
    });
  }

  if ($('#form-contact').length > 0) {
    $('#form-contact').on('init.field.fv', init_field_fv).formValidation({
      framework: 'bootstrap4',
      icon: {
        valid: 'ss-check',
        invalid: 'ss-delete',
        validating: 'ss-refresh'
      },
      autoFocus: true,
      fields: {
        contactModalName: {
          validMessage: 'Nice to meet you!',
          validators: {
            notEmpty: { message: 'Please enter your name.' },
            stringLength: {
              max: 100,
              message: 'The name must be more than 1 and less than 50 characters long.'
            }
          }
        },
        email: {
          validMessage: 'Great! We will send you a confirmation e-mail with tracking # after purchasing.',
          validators: {
            notEmpty: { message: 'The email address is required.' },
            stringLength: {
              min: 1,
              max: 100,
              message: 'The email address must be more than 6 and less than 30 characters long.'
            },
            emailAddress: { message: 'The email address is not valid.' }
          }
        },
        phoneNumber: {
          validMessage: 'Success! We will only call if there\u2019s a problem shipping to your location.',
          validators: {
            notEmpty: { message: 'Please supply a phone number so we can call if there are any problems shipping your flashlight.' },
            stringLength: {
              min: 12,
              message: 'Not a valid 10-digit US phone number (must not include spaces or special characters).'
            }
          }
        }
      }
    }).on('err.field.fv', function (e, data) {
    }).on('success.validator.fv', function (e, data) {
    }).on('err.form.fv', function (e, data) {
    }).on('success.form.fv', function (e, data) {
      submitContactForm();
      e.preventDefault();
    }).on('success.field.fv', success_field_fv).on('err.field.fv', err_field_fv);
    $('#form-contact').submit(function (e) {
      e.preventDefault();
    });
  }
  // Address Form Validator
  if ($('#form-address').length > 0) {
    $('#form-address').on('init.field.fv', init_field_fv).formValidation({
      framework: 'bootstrap4',
      icon: {
        valid: 'ss-check',
        invalid: 'ss-delete',
        validating: 'ss-refresh'
      },
      autoFocus: true,
      fields: {
        address1: {
          validMessage: 'Success! Free shipping confirmed.',
          validators: {
            stringLength: {
              min: 1,
              max: 100,
              message: 'The address must be less than 100 characters long.'
            },
            notEmpty: { message: 'The address is required.' }
          }
        },
        state: { validators: { notEmpty: { message: 'The State is required.' } } },
        city: {
          validMessage: 'That was easy!',
          validators: {
            stringLength: {
              max: 50,
              message: 'The city must be less than 50 characters long.'
            },
            notEmpty: { message: 'The city is required.' }
          }
        },
        postalCode: {
          validators: {
            stringLength: {
              min: 5,
              message: 'The zip code must be 5 number long.'
            },
            notEmpty: { message: 'The zip code is required.' }
          }
        }
      }
    }).on('err.field.fv', function (e, data) {
    }).on('success.validator.fv', function (e, data) {
    }).on('err.form.fv', function (e, data) {
    }).on('success.form.fv', function (e, data) {
      submitAddressForm();
      e.preventDefault();
    }).on('success.field.fv', success_field_fv).on('err.field.fv', err_field_fv);
    $('#form-address').submit(function (e) {
      e.preventDefault();
    });
    $('input[name=postalCode]').mask('00000', { 'translation': { 0: { pattern: /[0-9]/ } } });
  }
  $('.footer-image').click(function () {
    $('.btn-buy-modal').click();
  });
  
  if ($('#modal-contact').length > 0) {
    $('#modal-contact').on('shown.bs.modal', function (event) {
    });
  }
  // Once submitted contact form and click on the green button again show address modal
  $('.btn-buy-modal').click(function (e) {
    if (submittedContactForm) {
      $('.btn-address-modal').click();
      e.stopPropagation();
    }
  });
}());