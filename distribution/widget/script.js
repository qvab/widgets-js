define(['jquery', './js/ion.rangeSlider.js', './js/main.js'], function($) {
  var CustomWidget = function() {

    var self = this;
    var server = "https://terminal.linerapp.com";
    var hashServer;

    this.getServerUrl = function() {
      var serverUrl = 'https://terminal.linerapp.com/linerapp/index.php';
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
        return true;
      },

      init: function() {
        if (AMOCRM.data.is_card != "undefined" && AMOCRM.data.is_card) {
          if (AMOCRM.data.current_card.list_reload) {
            var myLeadField = false;
            $("span:contains('Моя сделка')").parent("div").next("div").find("input").change(function() {
              myLeadField = true;
            });

            if (!myLeadField) {
              var myObject = {
                leads: {
                  add: [
                    {
                      id: AMOCRM.data.current_card.id,
                      account_id: AMOCRM.constant('account').id,
                      pipeline_id: AMOCRM.data.current_card.model.attributes["lead[PIPELINE_ID]"],
                      custom_fields: [
                        {
                          name: "Моя сделка"
                        }
                      ]
                    }
                  ]
                },
                account: {
                  subdomain: AMOCRM.constant('account').subdomain,
                  id: AMOCRM.constant('account').id,
                  _links: {
                    self: "https://" + AMOCRM.constant('account').subdomain + ".amocrm.ru"
                  }
                },
                subdomain: AMOCRM.constant('account').subdomain,
                ajax: 1
              };

              $.ajax({
                type: "POST",
                data: $.param(myObject),
                url: "https://terminal.linerapp.com/leads/distribution",
                success: function(mes) {

                }
              });
            }
          }
        }

          return true;

      },

      bind_actions: function() {
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
                domain: settings.domain,
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
        $.post(server + "/licenseCheck.php", {
          user: AMOCRM.constant('account').subdomain,
          w_code: "distr"
        }, function(data) {
          hashServer = data;
        });
        var object = $("input[name^='libra']"), values = {};
        for (i = 0; i < object.length; i++) {
          var name = $(object[i]).prev().html();
          values[object[i].id] = {
            "rate": object[i].value,
            "name": name
          };
        }
        w_code = self.get_settings().widget_code;
        $('head').append('<link rel="stylesheet" href="/' + w_code + '/widget/css/ion.rangeSlider.css" />');
        $('head').append('<link rel="stylesheet" href="/' + w_code + '/widget/css/ion.rangeSlider.skinHTML5.css" />');
        self.crm_post(
            "https://terminal.linerapp.com/leads/distribution/dataset",
            {
              users: JSON.stringify(values),
              login: AMOCRM.constant('user').login,
              hash: AMOCRM.constant('user').api_key,
              subdomain: AMOCRM.constant('account').subdomain
            },
            function(res) {
              if ($(".mishanin-distribution").length < 1) {
                $(".widget_settings_block__fields").find(".widget_settings_block__item_field:eq(0)").before("<div class='mishanin-distribution'></div>");
                $(".widget_settings_block__fields").find(".widget_settings_block__item_field:eq(1)").hide();
                initRenderDist(res);
                var now = new Date();
                $("input[name^='libra']").val(now.getTime());
                $("input[name^='libra']").change();
              }
            }, "html"
        );

        var twig = require('twigjs');

        var linerapp_request_button = twig({ref: '/tmpl/controls/button.twig'}).render({
          name: 'linerapp_request_button',
          id: 'linerapp_request_button',
          text: "Запрос тестового периода",
          class_name: 'button-input_blue'
        });

        $('#widget_settings__fields_wrapper').prepend('<div class = "widget_settings_block__item_field">' + linerapp_request_button + '</div>');

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

        $("button.js-widget-save").on('click', function() {
          return $('#linerapp_ruls').prop('checked') || !!self.notifications('Вам необходимо', 'дать согласие на обработку данных');
        });

        $('button.js-widget-save').on('click', function() {
          var code = $('#widget_settings__fields_wrapper').find('input[name="linnerwidget_code"]').val();
          var field_my_lead = $("#add-field-my-lead:checked").val() ? $("#add-field-my-lead:checked").val() : 0;
          if (code != hashServer) {
            self.notifications('Ошибка установки', 'Неверный пароль для установки виджета');
            return false;
          } else {
            var libraPipeline = valuesPipelines();
            self.crm_post(
                'https://terminal.linerapp.com/leads/distribution',
                {
                  libra: JSON.stringify(libraPipeline),
                  field_my_lead: field_my_lead,
                  login: AMOCRM.constant('user').login,
                  hash: AMOCRM.constant('user').api_key,
                  subdomain: AMOCRM.constant('account').subdomain
                }
            );
            return true;
          }
        });

        return true;
      },
      onSave: function() {


        return true;
      },
      destroy: function() {
        $.post(server + "/destroy.php", {
          user: AMOCRM.constant('account').subdomain,
          w_code: "distr"
        }, function(data) {
          hashServer = data;
        });
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