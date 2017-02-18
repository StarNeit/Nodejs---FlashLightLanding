(function() {
    'use strict';
    if (customWrapperForIsMobileDevice()) {
        $('#checkout-wrapper').addClass('mobile-mode');
        $('#step-4 .step-title span').html('Step #2 :');
    }
    $('input[name=phoneNumber]').mask('000-000-0000', {'translation': {0: {pattern: /[0-9*]/}}});
    var MediaStorage = getOrderData();

    function submitOrderForm(orderForm) {
        $('div#js-div-loading-bar').show();
        var year = $('select[name=year]').val(),
            month = $('select[name=month]').val();
        var d = new Date();
        var currentYear = d.getFullYear().toString().substr(2, 2),
            currentMonth = ('0' + (d.getMonth() + 1)).slice(-2);
        if (!(currentYear < year || currentYear === year && currentMonth <= month)) {
            $('div#js-div-loading-bar').hide();
            bootstrapModal('Invalid Expiration Date', 'Problem with your order');
            return;
        }
        var apiFields = [
            'firstName',
            'lastName',
            'emailAddress',
            'phoneNumber',
            'address1',
            'city',
            'state',
            'postalCode',
            'cardNumber',
            'cardSecurityCode',
            'cardMonth',
            'cardYear',
            'campaignId',
            'productId'
        ];
        var orderDetails = {};
        for (var index = 0; index < apiFields.length; index++) {
            var key = apiFields[index];
            var uVal, dirty;
            if (key !== 'productId') {
                dirty = $('[name=' + key + ']').val();
            } else {
                dirty = $('input[name=\'productId\']:checked', '#checkoutForm').val();
            }
            uVal = filterXSS(dirty);
            orderDetails[key] = uVal;
        }
        // if(evil) return;
        
        orderDetails.cardMonth = $('[name=month]').val();
        orderDetails.cardYear = $('[name=year]').val();
        orderDetails.lastName = 'NA';
        orderDetails.orderId = MediaStorage.orderId;
        var contactInfo = {};
        contactInfo.firstName = orderDetails.firstName;
        contactInfo.lastName = orderDetails.lastName;
        contactInfo.emailAddress = orderDetails.emailAddress;
        contactInfo.phoneNumber = orderDetails.phoneNumber;
        contactInfo.address1 = orderDetails.address1;
        contactInfo.city = orderDetails.city;
        contactInfo.state = orderDetails.state;
        contactInfo.postalCode = orderDetails.postalCode;
        callAPI('update-contact', contactInfo, 'POST', function(resp) {
            console.log(resp);
        });
        callAPI('create-order', orderDetails, 'POST', function(resp) {
            if (resp.success) {
                $('#checkoutForm .btn-complete').removeClass('pulse');
                if (resp.orderId) {
                    localStorage.setItem('orderId', resp.orderId);
                }
                // window.location = GlobalConfig.BasePagePath + "us_batteryoffer.html?orderId=" + MediaStorage.orderId + "&pId=" + orderDetails.productId;
                window.location = 'us_batteryoffer.html?orderId=' + MediaStorage.orderId + '&pId=' + orderDetails.productId;
            } else {
                $('#checkoutForm .btn-complete').removeClass('pulse');
                if (resp.message) {
                    var errHead = 'Problem with your order';
                    var errBody;
                    if (resp.message !== 'Invalid Credit Card Number') {
                        errHead = 'Payment validation failed:  Processor Declined.';
                        resp.message += '<br><br>For security reasons, you must re-enter a new card number.<br><br>' + 'Tip: you may try another card or call <a href=\'tel:+18558807233\'>(855) 880-7233</a>.';
                    }
                    errBody = '<span style=\'font-size:20px\'>' + resp.message + '<span>';
                    bootstrapModal(errBody, errHead);
                }
            }
            $('div#js-div-loading-bar').hide();
        });
        return false;
    }
    // Checkout Form Validator
    var CheckoutFieldsReq;
    if (!customWrapperForIsMobileDevice()) {
        CheckoutFieldsReq = [
            'firstName',
            'lastName',
            'emailAddress',
            'phoneNumber',
            'address1',
            'city',
            'state',
            'postalCode',
            'cardNumber',
            'month',
            'year'
        ];
    } else {
        CheckoutFieldsReq = [
            'cardNumber',
            'month',
            'year'
        ];
    }

    function checkoutButtonPulse(CheckoutFieldsReq, invalidFieldsCount) {
        var cfCount = CheckoutFieldsReq.length,
            icfCount = 1;
        if (customWrapperForIsMobileDevice()) {
            icfCount = 0;
        }
        for (var i = 0; i < CheckoutFieldsReq.length; i++) {
            if ($('[name=\'' + CheckoutFieldsReq[i] + '\'].required').parents('.form-group').hasClass('has-success')) {
                icfCount++;
            }
        }
        if (invalidFieldsCount === 0) {
            if ($('#checkoutForm .fv-has-feedback.has-warning').length > 0) {
                $('#checkoutForm .btn-complete').removeClass('pulse');
            } else {
                if (cfCount === icfCount) {
                    $('#checkoutForm .btn-complete').addClass('pulse');
                } else {
                    $('#checkoutForm .btn-complete').removeClass('pulse');
                }
            }
        } else {
            $('#checkoutForm .btn-complete').removeClass('pulse');
        }
    }
    if ($('#checkoutForm').length > 0) {
        $('#checkoutForm').on('init.field.fv', function(e, data) {
            var field = data.field,
                $field = data.element,
                bv = data.fv;
            // FormValidation instance
            // Create a span element to show valid message
            // and place it right before the field
            var $span = $('<small/>').addClass('help-block validMessage text-success').attr('data-field', field).insertAfter($field).hide();
            // Retrieve the valid message via getOptions()
            var message = bv.getOptions(field).validMessage;
            if (message) {
                $span.text(message);
            }
        }).formValidation({
            framework: 'bootstrap4',
            icon: {
                valid: 'ss-check',
                invalid: 'ss-delete',
                validating: 'ss-refresh'
            },
            autoFocus: true,
            fields: {
                firstName: {
                    validMessage: 'Nice to meet you!',
                    validators: {
                        notEmpty: { message: 'Please enter your name.' },
                        stringLength: {
                            min: 1,
                            max: 30,
                            message: 'The name must be more than 1 and less than 50 characters long.'
                        }
                    }
                },
                emailAddress: {
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
                            // real that is "10" but that include 2 symbols "-"
                            message: 'Not a valid 10-digit US phone number (must not include spaces or special characters).'
                        }
                    }
                },
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
                },
                cardNumber: {
                    validMessage: '',
                    validators: {
                        creditCard: {
                            message: 'Enter a valid card number.',

                            // This will allow to Accept test credit card numbers
                            /*
                            transformer: function($field, validatorName, validator) {
                                
                                var TEST_CARD_NUMBERS = ['3333222233332222', '30030008444444'];
                                // We will transform those test card numbers into a valid one as below
                                var VALID_CARD_NUMBER = '4444111144441111';

                                // Get the number pr by user
                                var value = $field.val();
                                var CountOfChars = parseInt($field.val().length);
                                if (CountOfChars === 17) {
                                    value = value.substr(0, CountOfChars - 1);
                                }

                                // Check if it"s one of test card numbers
                                if (value !== '' && $.inArray(value, TEST_CARD_NUMBERS) !== -1) {
                                    // then turn it to be a valid one defined by VALID_CARD_NUMBER
                                    return VALID_CARD_NUMBER;
                                } else {
                                    // Otherwise, just return the initial value
                                    return value;
                                }
                            }
                            */
                        },

                        notEmpty: { message: 'Enter the card number.' },
                        stringLength: {
                            min: 15,
                            message: 'The credit card can be 15 or 16 digits.'
                        }
                    }
                },
                // CSC
                cardSecurityCode: { validators: { notEmpty: { message: 'The Security Code is required.' } } },
                month: {
                    validators: {
                        notEmpty: { message: 'The Month is required.' },
                        callback: {
                            message: 'Please set month more or equal current.',
                            callback: function(value, validator, $field) {
                                var form = $field.parents('form');
                                var currentDate = new Date();
                                var year = parseInt(currentDate.getYear());
                                var yearVal = parseInt(form.find('[name=year]').val());
                                if (isNaN(yearVal) || yearVal === null || yearVal === undefined) {
                                    return true;
                                } else {
                                    var selectedYear = 100 + (parseInt(form.find('[name=year]').val()) || 0);
                                    var currentMonth = parseInt(value) - 1 >= parseInt(currentDate.getMonth());
                                    if (selectedYear === year) {
                                        if (currentMonth) {
                                            form.find('[name=year]').parents('.form-group').removeClass('has-warning').addClass('has-success');
                                            form.find('[name=year]').parents('.form-group').find('.fv-control-feedback').removeClass('fa-remove').addClass('fa-check');
                                            form.find('[name=year]').parents('.form-group').find('.form-control-feedback').hide();
                                        } else {
                                            form.find('[name=year]').parents('.form-group').removeClass('has-success').addClass('has-warning');
                                            form.find('[name=year]').parents('.form-group').find('.fv-control-feedback').removeClass('fa-check').addClass('fa-remove');
                                            form.find('[name=year]').parents('.form-group').find('[data-fv-validator=\'callback\']').show();
                                        }
                                        return currentMonth;
                                    } else {
                                        form.find('[name=year]').parents('.form-group').removeClass('has-warning').addClass('has-success');
                                        form.find('[name=year]').parents('.form-group').find('.fv-control-feedback').removeClass('fa-remove').addClass('fa-check');
                                        form.find('[name=year]').parents('.form-group').find('.form-control-feedback').hide();
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                },
                year: {
                    validators: {
                        notEmpty: { message: 'The Year is required.' },
                        callback: {
                            message: 'Please set year more or equal current.',
                            callback: function(value, validator, $field) {
                                var form = $field.parents('form');
                                var currentDate = new Date();
                                var yearCondition = 100 + parseInt(value) >= parseInt(currentDate.getYear());
                                $('#checkoutForm').formValidation('revalidateField', 'month');
                                if ($('#checkoutForm').find('[name=month]').parents('.form-group').hasClass('has-warning')) {
                                    return false;
                                } else {
                                    return yearCondition;
                                }
                            }
                        }
                    }
                }
            }
        }).on('success.validator.fv', function(e, data) {
            if (data.field === 'cardNumber' && data.validator === 'creditCard') {
                var $icon = data.element.data('fv.icon');
                $('.cc-logos ul>li img').removeClass('active');
                $('.cc-logos ul>li img[data-value=\'' + data.result.type + '\']').addClass('active');
            }
        }).on('err.field.fv', function(e, data) {
            var field = data.field,
                $field = data.element;
            $field.next('.validMessage[data-field=\'' + field + '\']').hide();
            var invalidFieldsCount = data.fv.getInvalidFields().length;
            checkoutButtonPulse(CheckoutFieldsReq, invalidFieldsCount);
        }).on('status.field.fv', function(e, data) {
            data.fv.disableSubmitButtons(false);
        }).on('success.field.fv', function(e, data) {
            var field = data.field,
                $field = data.element;
            if (data.fv.getSubmitButton()) {
                data.fv.disableSubmitButtons(false);
            }
            // Show the valid message element
            $field.next('.validMessage[data-field=\'' + field + '\']').show();
            var invalidFieldsCount = data.fv.getInvalidFields().length;
            checkoutButtonPulse(CheckoutFieldsReq, invalidFieldsCount);
        }).on('err.form.fv', function(e) {}).on('success.form.fv', function(e) {
            submitOrderForm('#checkoutForm');
            e.preventDefault();
        });
        // Credit Card Behavior BEGIN

        $('input#creditcard').on('keyup', function() {
            if ($(this).val() === '' || $(this).val() === undefined) {
                $(this).parents('.form-group').prev('.payment-icon').find('.cc-icon').removeClass('inactive active');
            }
        }).on('cardChange', function(e, card) {
            if (card.supported) {
                $('.payment-icon .cc-icon.cc-' + card.type).parents('a').siblings().find('.cc-icon').removeClass('active').addClass('inactive');
                $('.payment-icon .cc-icon.cc-' + card.type).removeClass('inactive').addClass('active');
            } else {
                $('.payment-icon .cc-icon').removeClass('inactive active');
            }
        });
        // END Credit Card Behavior
        $('#checkoutForm').submit(function(e) {
            e.preventDefault();
        });
        //  Apply mask for checkout fields
        $('input[name=cardNumber]').mask('0000000000000000', { 'translation': { 0: { pattern: /[0-9]/ } } });
        $('input[name=postalCode]').mask('00000', { 'translation': { 0: { pattern: /[0-9]/ } } });
        var checkoutFields = [
            'firstName',
            'lastName',
            'emailAddress',
            'phoneNumber',
            'address1',
            'city',
            'state',
            'postalCode',
            'cardNumber',
            'month',
            'year'
        ];
        // Load cached values
        $.each(checkoutFields, function(index, value) {
            if ($('[name=' + value + ']').length === 0) {
                return;
            }
            var uVal = MediaStorage[value];
            if (uVal && uVal !== null && uVal !== 'null') {
                $('[name=' + value + ']').val(uVal);
                $('[name=' + value + ']').data('previousValue', uVal);
                $('#checkoutForm').formValidation('revalidateField', value);
            }
        });
        // Save Checkout Page details to DB engine
        var saveToMediaStorage = function() {
            $.each(checkoutFields, function(index, value) {
                if (value !== 'cardNumber' && value !== 'year' && value !== 'month') {
                    if ($('[name=' + value + ']').length > 0) {
                        var uVal = $('[name=' + value + ']').val();
                        localStorage.setItem(value, uVal);
                    }
                }
            });
        };
        $('form').on('change', saveToMediaStorage);
        window.onbeforeunload = saveToMediaStorage;
    }
}());
