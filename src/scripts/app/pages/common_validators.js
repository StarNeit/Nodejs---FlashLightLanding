function validate() {
  'use strict';
  // Look for ios devices and safari
  if (isMobileSafari()) {
    // Search for credit card input and change it to text field
    if ($('input#creditcard').length > 0) {
      $('input#creditcard').attr('type', 'text');
    }
  }
  if (!customWrapperForIsMobileDevice()) {
    $('input[type=number]').attr('type', 'text');
  }
  
  // Mailcheck Plugin Code here
  if ($('#email').length > 0) {
    var domains = ['hotmail.com', 'gmail.com', 'aol.com'];
    var topLevelDomains = ["com", "net", "org"];
    $('#email').on('blur', function (event) {
      // console.log("event ", event);
      // console.log("this ", $(this));
      $(this).mailcheck({
        domains: domains,
        topLevelDomains: topLevelDomains,
        suggested: function (element, suggestion) {
          // console.log("suggestion ", suggestion.full);
          $('#email + small').show();
          $('#email + small').html('Did you mean <a href=\'javascript:void(0)\'>' + suggestion.full + '</a>');
        },
        empty: function (element) {
          // console.log("suggestion ", "No suggestion");
        }
      });
    });
    // If user click on the suggested email, it will replace that email with suggested one.
    $('body').on('click', '#email + small a', function () {
      $('#email').val($(this).html());
      $('#email + small').hide();
      $('#email + small').html('Great! We will send you a confirmation e-mail with tracking # after purchasing.');
      if ($('form').length > 0) {
        $('form').formValidation('revalidateField', 'email');
      }
    });
  }
}
validate();