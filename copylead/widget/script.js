define(['jquery'], function($) {
  var CustomWidget = function() {

    var self = this;
    var server = "https://terminal.linerapp.com";
    var hashServer;
    $.post(server+"/licenseCheck.php", {
      user: AMOCRM.constant('account').subdomain,
      w_code: "copylead"
    }, function(data){
      hashServer = data;
    });

    this.getServerUrl = function() {
      var serverUrl = server + '/linerapp/index.php';
      return serverUrl;
    };

    this.notifications = function(header, message, wait_time) {
      var inbox = $('#popups_inbox'),
          zIndex = inbox.css('z-index'),
          t = wait_time || 6000;

      AMOCRM.notifications.show_message_error({
        text: message || '', header: header || ''
      });
      inbox.css('z-index', 9001);
      setTimeout(function() {
        inbox.css('z-index', zIndex);
      }, t);
    };

    this.callbacks = {

      render: function() {
        if (typeof(AMOCRM.data.current_card) != 'undefined') {
          if (AMOCRM.data.current_card.id == 0) {
            return false;
          }
        }
        self.render_template({
          caption: {
            class_name: 'js-aci-caption',
            html: ''
          }, body: '',
          render: '<div class="aci-form linerapp_copylead_aci-form"><a id="copylead" href="#">Копировать сделку</a></div>'
        });
        return true;
      },

      init: function() {
        return true;
      },

      bind_actions: function() {

        $(document).on('click', "#copylead", function(e) {
          e.preventDefault();
          $.post("https://terminal.linerapp.com/leads/duplicate", {
            lead_id: AMOCRM.data.current_card.id,
            subdomain: AMOCRM.constant('account').subdomain
          });
        });

        $(document).ajaxComplete(function(event, xhr, settings) {
          if (settings.url === server + '/leads/duplicate') {
            window.location.replace(xhr.responseJSON.response.redirect);
          }
        });

        $(document).off('click', '#linerapp_request_button').on('click', '#linerapp_request_button', function() {
          var widget = self.i18n('widget');
          var settings = AMOCRM.widgets.system;

          self.crm_post(
              self.getServerUrl(),
              {
                action: "add-lead",
                name: widget.name,
                amohash: settings.amohash,
                amouser: settings.amouser,
                domain: settings.domain
              },
              function(response) {
                if (response.status == 'ok') {
                  self.notifications('Запрос успешно отправлен', 'Запрос на тестовый период принят.');
                }
                if (response.status == 'error') {
                  self.notifications('Ошибка', 'Произошла ошибка, попробуйте еще раз.');
                }
              },
              'json'
          );

        });

        return true;
      },
      settings: function() {
        var sValCode = self.params.linnerwidget_code;
        if (typeof sValCode == "undefined" || !sValCode) {
          var twig = require('twigjs');
          var linerapp_request_button = twig({ref: '/tmpl/controls/button.twig'}).render({
            name: 'linerapp_request_button',
            id: 'linerapp_request_button',
            text: "Запрос тестового периода",
            class_name: 'button-input_blue'
          });
          $('#widget_settings__fields_wrapper').prepend('<div class = "widget_settings_block__item_field">' + linerapp_request_button + '</div>');
        }

        var dop_field = '<div class="widget_settings_block__item_field">' +
            '<label class="control-checkbox checkboxes_dropdown__label   is-checked">' +
            '<div class="control-checkbox__body">' +
            '<input type="checkbox" class="js-item-checkbox" name="" id="linerapp_ruls" value="" checked data-value="1">' +
            '<span class="control-checkbox__helper "></span>' +
            '</div>' +
            '<div class="control-checkbox__text element__text checkboxes_dropdown__label_title yp_confirm_ruls" style = "white-space: normal; font-size: 12px;">Я подтверждаю согласие на передачу данных аккаунта amoCRM на удаленный сервер для обеспечения работоспособности виджета.</div>' +
            '</label>' +
            '</div>';
        $('#widget_settings__fields_wrapper').append(dop_field);

        $("button.js-widget-save, .js-widget-install").click(function() {
          if ($("#linerapp_ruls").prop("checked") !== true) {
            self.notifications('Вам необходимо', 'дать согласие на обработку данных');
            return false;
          }
          if ($("#widget_settings__fields_wrapper").find('input[name="linnerwidget_code"]').val() != hashServer) {
            self.notifications("Ошибка установки", "Неверный пароль для установки виджета");
            return false;
          }
          return true;
        });

        return true;
      },
      onSave: function() {
        self.crm_post(
            server + '/account/add',
            {
              login: AMOCRM.constant('user').login,
              hash: AMOCRM.constant('user').api_key,
              subdomain: AMOCRM.constant('account').subdomain
            },
            function(msg) {

            },
            'json',
            function() {

            }
        );

        return true;
      },
      destroy: function() {
      },
      contacts: {
        selected: function() {
        }
      },
      leads: {
        selected: function() {
        }
      },
      tasks: {
        selected: function() {
        }
      }
    };
    return this;
  };
  return CustomWidget;
});