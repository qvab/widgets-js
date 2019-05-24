function LinerAppStorage() {
  var self = this;
  this.httpServer = "https://terminal.linerapp.com";

  this.auth = function(widget, twig) {
    $(this.elemetsHTML.style).appendTo("head");
    if (!this.app.twig) {
      this.app.twig = twig;
    }
    if (this.app.widget) {
      this.app.widget = widget;
    }

    $(".widget_settings_block__fields").find(".widget_settings_block__item_field:eq(0)").hide(); // Скрываем пользователей

    $.ajax({
      type: "GET",
      url: self.httpServer + '/docs/test_token/' + AMOCRM.constant('account').subdomain,
      dataType: "json",
      success: function(data) {
        if (data.token != 0) {
          $(".widget_settings_block__fields").find(".widget_settings_block__item_field:eq(0)").show(); // Отображаем пользователей
          if ($("#linerapp_button_auth").length < 1) {
            $("#linerapp_button_auth").remove();
          }
          self.getFolders();
          self.getTypes();
        } else {
          self.getToken();
        }
      }
    });
  };


  this.getToken = function() {
    if ($("#linerapp_button_auth").length < 1) {
      $(".widget_settings_block__fields").find(".widget_settings_block__item_field:eq(0)").hide(); // Скрываем пользователей

      var sTempAuth = self.app.twig({ref: '/tmpl/controls/button.twig'}).render({
        name: '',
        id: 'linerapp_button_auth',
        text: "Авторизация в Google Drive",
        class_name: 'button-input_blue'
      });

      $(".widget_settings_block__fields").find(".widget_settings_block__item_field:eq(0)").after(sTempAuth);

      var newWin;
      $("#linerapp_button_auth").click(function() {
        newWin = window.open(self.httpServer + "/docs/auth?subdomain=" + AMOCRM.constant('account').subdomain, 'Авторизация в Google', 'width=600,height=400,left=250,top=250');
        var timer = setInterval(function() {
          var currentLink = newWin;
          if (newWin.closed) {
            $(".widget_settings_block__fields").find(".widget_settings_block__item_field:eq(0)").show(); // Отображаем пользователей
            self.auth();
            clearInterval(timer);
          }
        }, 100);
      });
    }
  };

  /**
   * Получение списка папок на диске и их рендер
   */
  this.getFolders = function() {
    $.ajax({
      type: "GET",
      url: self.httpServer + '/docs/list/folders?subdomain=' + AMOCRM.constant('account').subdomain,
      dataType: "json",
      success: function(data) {

        var listSelectFolders = self.app.twig({ref: '/tmpl/controls/select.twig'}).render({
          name: 'select-folders',
          selected: data.current,
          items: data.list,
          id: 'linerapp-select-folders',
          class_name: ''
        });
        var obSelectFolders = '<div class="widget_settings_block__item_field linerapp-list-folders"><div class="widget_settings_block__title_field" style="margin-bottom: 15px;" title="">Папка Google Drive для размещения файлов: </div><div class="widget_settings_block__input_field">' + listSelectFolders + '</div></div>';
        $(obSelectFolders).insertAfter(".widget_settings_block__fields .widget_settings_block__item_field:eq(0)");

      }
    });

  };


  /**
   *
   */

  this.renderListTypes = function() {
    $(".linerapp-list-types").html("");
    $.ajax({
      type: "GET",
      url: self.httpServer + '/docs/get/types/' + AMOCRM.constant('account').subdomain,
      dataType: "json",
      success: function(data) {
        if (data) {
          for (var key in data) {
            $(".linerapp-list-types").append('<li class="linerapp-type-id-' + key + '"><b>' + data[key].name + '</b><span><a href="" data-id-type="' + key + '" class="linerapp-del-type icon icon-delete-trash"></a></span></li>');
          }
          $(".linerapp-del-type").click(function() {
            var id = $(this).attr("data-id-type") - 0;
            $.ajax({
              type: "GET",
              url: self.httpServer + '/docs/delete/type/' + id,
              success: function(mes) {
                console.log(mes);
                $(".linerapp-type-id-" + id).remove();
              }
            });

            return false;
          });

        }


      }
    });


  };
  /**
   * Получение списка типов документов и их рендер
   */
  this.getTypes = function() {

    var addTypeFile = self.app.twig({ref: '/tmpl/controls/input.twig'}).render({
      name: '',
      id: 'linerapp-name-type-file',
      value: "",
      placeholder: 'Название тппа',
      class_name: ''
    });

    var addTypeFileBtn = self.app.twig({ref: '/tmpl/controls/button.twig'}).render({
      name: '',
      id: 'linerapp_button_add_type_file',
      text: "Добавить тип",
      class_name: 'button-input_blue'
    });


    var obSelectFolders = '<div class="widget_settings_block__item_field linerapp-block-add-type" style="margin-top: 15px; border: 1px #4D85E6 solid; padding: 15px;"><div class="widget_settings_block__title_field" style="margin-bottom: 15px;" title="">Добавление типа документа: </div><div class="widget_settings_block__input_field">' + addTypeFile + ' ' + addTypeFileBtn + '</div></div>';
    $(obSelectFolders).insertAfter(".widget_settings_block__fields .widget_settings_block__item_field:eq(0)");


    $('<div class="widget_settings_block__item_field" style="margin-top: 15px;"><div class="widget_settings_block__title_field" title="">Список типов: </div><div class="widget_settings_block__input_field"></div><ul class="linerapp-list-types"></ul></div>')
        .insertAfter(".linerapp-block-add-type");


    $("#linerapp_button_add_type_file").click(function() {
      var name = $("#linerapp-name-type-file").val();

      $.ajax({
        type: "POST",
        url: self.httpServer + '/docs/add/type',
        data: "subdomain=" + AMOCRM.constant('account').subdomain + "&name=" + name,
        success: function(data) {
          $("#linerapp-name-type-file").val("");
          self.renderListTypes();
        }

      });
    });


    self.renderListTypes(); // Вызов рендера списка типов документов
  };


  this.slideButton = function() {
    console.log("init slideButton");
    console.log(self.app.buttonSlide);
    if ($(".card-tabs__dots.js-linked-toggler .button-input-wrapper").length > 0) {
      if (!self.app.buttonSlide) {
        self.app.buttonSlide = $('<li class="button-input__context-menu__item  element__ js-card-tab card-tabs__item_in-context" id="linked_context_settings"><div class="button-input__context-menu__item__inner"><svg class="button-input__context-menu__item__icon svg-icon svg-common--settings-dims "><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#common--settings"></use></svg><span class="button-input__context-menu__item__text h-text-overflow">LinerAppDOC</span></div></li>')
            .appendTo(".card-tabs__dots.js-linked-toggler .button-input__context-menu ");
        self.app.buttonSlide.click(function() {
          if (!self.app.statusApp) {
            $(".js-card-tab").removeClass("selected");
            $(".linerapp-btn-init").addClass("selected");
            var corsLeft = $(".linerapp-btn-init").offset().left;
            $(".card-tabs-slider").css("left", (corsLeft - 85) + 'px');
            self.getData();
            history.replaceState(null, "LinerApp DOC", "?tab_id=linerappdoc");
          } else {
            $(".linerapp-btn-init").removeClass("selected");
            self.close();
          }
          return false;
        });
      }
    } else {
      if (self.app.buttonSlide) {
        console.log("remove slideButton");
        self.app.buttonSlide.remove();
        self.app.buttonSlide = false;
      }
    }
  };

  this.timerMoveFlag = false;
  this.timerMove = false;
  /**
   * Инициализаця виджета
   */
  this.init = function() {
    $(".js-card-column-resizer").mousedown(function() {
      self.timerMoveFlag = true;
    });

    $(document).mouseup(function() {
      if (self.timerMoveFlag) {
        clearTimeout(self.timerMove);
        self.timerMove = setTimeout(function() {
          self.slideButton();
          self.init();
          self.timerMoveFlag = false;
        }, 100);
      }
    });

    if (require('twigjs')) {
      this.app.twig = require('twigjs');
    }
    $(".linerapp-btn-init").remove();
    self.slideButton();
    this.app.buttonInit = false;
    this.app.buttonInit = $(this.elemetsHTML.buttonInit).appendTo(".card-tabs-wrapper .card-tabs");
    this.initHistory();
    this.app.buttonInit.click(function() {
      if (!self.app.statusApp) {
        $(".js-card-tab").removeClass("selected");
        $(".linerapp-btn-init").addClass("selected");
        var corsLeft = $(".linerapp-btn-init").offset().left;
        $(".card-tabs-slider").css("left", (corsLeft - 85) + 'px');
        self.getData();
        history.replaceState(null, "LinerApp DOC", "?tab_id=linerappdoc");
      } else {
        $(".linerapp-btn-init").removeClass("selected");
        self.close();
      }
      return false;
    });
  };


  /**
   * History API
   */

  this.initHistory = function() {
    $(".card-tabs__item.js-card-tab").click(function() {
      if (location.search != "?tab_id=linerappdoc" || $(this).attr("data-id") != "linerappdoc") {
        $(".linerapp-btn-init").removeClass("selected");
        self.close();
      } else {
        $(".linerapp-btn-init").addClass("selected");
        self.init();
      }
    });

  };

  /**
   * Получение данных с сервера
   */
  this.getData = function() {
    if (!self.app.serverData) {
      $.ajax({
        type: "POST",
        url: "https://terminal.linerapp.com/docs/get/files/lead",
        data: "subdomain=" + AMOCRM.constant('account').subdomain + "&id_amo=" + AMOCRM.data.current_card.id,
        success: function(response) {
          self.app.serverData = JSON.parse(response);
          self.render(self.app.serverData);
          self.blockDelete();
        }
      });
    } else {
      self.render(self.app.serverData);
    }
  };


  this.blockDelete = function() {
    var obUser = this.app.serverData.settings.users;
    if (obUser[AMOCRM.constant('user').id] == 1) {
      $(".linerapp-del-block").remove();
    }
  };


  this.elemetsHTML = {
    style: "<style> .linerapp-docs-field {float: left;width: 33%; text-align: center; } .linerapp-docs-contain-add-file { margin: 30px auto; } .linerapp-docs-filelist {margin: 10px auto 0;} .linerapp-docs-files-title {margin: 0px 15px 25px;padding: 13px 0;border-bottom: 2px #ccc solid;font-weight: 600;} .linerapp-docs-files-content table td {font-size: 13px;padding: 10px;overflow: hidden;max-width: 25%; vertical-align: middle;} tr.linerapp-table-header th {text-align: center;padding: 10px; } .field-list li { padding: 10px 0; min-width: 80px;}.field-list li + li {margin-top: 10px;border-top: 1px #ccc solid;} .field-list li > span:nth-of-type(1) {display: inline-block;width: 70%;overflow: hidden;text-overflow: ellipsis;} .field-list a {float: right;} .icon-linerapp-download {width: 22px;height: 22px; background-color: transparent; background-image: url('/upl/" + w_code + "/widget/images/download_file.png'); background-repeat: no-repeat;}.linerapp-upload { width: 100%; margin-top: 15px;} .linerapp-upload td, .linerapp-upload th {text-align: left;padding: 10px 10px; width: 33.3%;} .linerapp-container-file-input {position: relative;} .linerapp-container-file-input > input {height: 100%;left: 0;opacity: 0;position: absolute;top: 0;width: 100%;}.linerapp-place-drop .linerapp-container-file-input > div {padding: 25px 0;text-align: center; font-size: 13px;} .linerapp-place-drop:hover {background-color: rgba(77,133,230,0.6);color: #fff;}.linerapp-place-drop {border: 2px dashed #4d85e6;margin: 15px auto;transition: background-color 0.3s, color 0.3s;} .linerapp-upload-list li {text-align: left;margin-top: 9px;} .linerapp-upload-list li b {display: inline-block;} .linerapp-upload-list li > span {float: right;} .linerapp-docs {margin-top: -14px;} .linerapp-docs-files-content table {width: 100%;} .linerapp-list-types li > span {float: right;} .linerapp-list-types {border: 1px #ff7e00 solid;padding: 15px;margin-bottom: 15px;} .linerapp-list-types li + li {border-top: 1px #ccc solid;} .linerapp-list-types li {padding: 10px 0;} .linerapp-list-folders {border: 1px #4D85E6 solid;padding: 15px;} .widget_settings_block__fields .widget_settings_block__item_field:nth-of-type(1) {margin-bottom: 15px;padding: 15px;border: 1px #4D85E6 solid;}</style>",


    loader: '<div class="default-overlay widget-settings__overlay default-overlay-visible" id="service_overlay" style="z-index: 101"><span class="spinner-icon expanded spinner-icon-abs-center" id="service_loader"></span></div>',
    buttonInit: '<div class="card-tabs__item js-card-tab linerapp-btn-init" data-id="linerappdoc"><span class="card-tabs__item-inner" title="LinerAppDOC">LinerAppDOC</span></div>',
    wrapper: '<div class="linerapp-docs"></div>',
    header: '<div class="linerapp-docs-header"></div>',
    title: '<div class="linerapp-docs-title">LinerApp Docs</div>',
    tabsControl: '<div class="linerapp-docs-tabs"></div>',
    containAddFile: {
      wrapper: '<div class="linerapp-upload-space" style="display: none;"></div>',
      form: '<form method="POST" class="my-form" enctype="multipart/form-data"></form>',
      table: '<table class="linerapp-upload"><thead><tr><th>Тип</th><th>Название</th><th>Дата</th></tr></thead><tbody><tr class="linerapp-container-form"></tr></tbody></table>',
      dropZone: '<div class="linerapp-place-drop"><div class="linerapp-container-file-input"><input type="file" id="linerapp-field-file" name="linerapp-files[]" multiple/> <div>Выберете файлы с компьютера или перетащите их сюда мышкой</div></div></div><div class="linerapp-upload-list"><ul></ul></div><button id="linerapp-submit" type="4" class="button-input_blue button-input linerapp-docs-btn btn-add-file"><span class="button-input-inner "><span class="button-input-inner__text">Загрузить</span></span></button>',
      fields: {
        typeFile: '<td></td>',
        nameFile: '<td><input class="cf-field-input text-input" required="" id="linerapp-field-name"/></td>',
        dateFile: '<td></td>'
      }
    },
    tabs: {
      addFile: '<button type="4" class="button-input_blue button-input linerapp-docs-btn btn-add-file"><span class="button-input-inner "><span class="button-input-inner__text">Добавить документ</span></span></div>'
    },
    list: {
      wrapper: '<div class="linerapp-docs-filelist"></div>',
      title: '<div class="linerapp-docs-files-title">Список файлов</div>',
      content: '<div class="linerapp-docs-files-content"></div>',
      header: '<tr class="linerapp-table-header"><th>Тип</th><th>Название</th><th>Файлы</th><th>Дата</th><th>Дата<br />прикрепления</th><th>Отправитель</th><th></th>',
      item: function(arParams) {
        self.files.list[arParams.id] = {
          jq: false,
          data: []
        };

        var listFiles = {};
        var listFilesHTML = '';

        for (var iFileId in arParams.files) {
          listFiles[iFileId] = {
            name: arParams.files[iFileId].name,
            html: '<li><span>' + arParams.files[iFileId].name + '</span><a target="_blank" class="icon-linerapp-download" href="' + self.httpServer + '/docs/get/file/' + arParams.files[iFileId].google_id_file + '"></a></li>'
          };
          listFilesHTML += listFiles[iFileId].html;
        }
        var user;
        if(typeof  AMOCRM.constant("account")["users"][arParams.user] != "undefined"){
          user=AMOCRM.constant("account")["users"][arParams.user];
        }else{
          user="Н/Д";
        }
        $('<tr id="linerapp-block-' + arParams.id + '" class="linerapp-item">\
            <td class="field-type">' + arParams.type.option + '</td>\
        <td class="field-name">' + arParams.name + '</td>\
        <td class="field-list">\
            <ul>' + listFilesHTML + '</ul>\</td>\
            <td class="field-date">' + arParams.date + '</td>\
            <td class="field-date-attache">' + arParams.date_attache + '</td>\
            <td class="field-user">' + user + '</td>\
            <td class="field-buttons"><a data-block-id="' + arParams.id + '" href="' + self.httpServer + '/docs/delete/file/' + arParams.id + '?subdomain=' + AMOCRM.constant('account').subdomain + '" class="linerapp-del-block icon icon-delete-trash"></a></td>\
            </tr>').appendTo(self.app.list.content.find("table"));
      }
    }
  };


  // Объект всего приложения
  this.app = {
    settings: false,
    move: false,
    widget: false,
    twig: false,
    serverData: false,
    statusApp: false,
    buttonInit: false,
    buttonSlide: false,
    wrapper: false,
    tabsControl: false,
    tabs: {
      addFile: false
    },
    containAddFile: {
      wrapper: false,
      dropZone: false,
      inputFile: false,
      form: false,
      fields: {
        typeFile: false,
        nameFile: false,
        dateFile: false
      }
    },
    list: {
      wrapper: false,
      title: false,
      content: false,
      item: {}
    }
  };


  this.google = {
    listFiles: {}
  };

  this.files = {
    list: {}
  };


  // Объект формы
  this.form = {
    isFile: 0,
    type: false,
    name: false,
    date: false,
    files: {}
  };


  /**
   * Орисовка виджета
   */
  this.render = function(arListFiles) {
    this.google.listFiles = arListFiles.files || this.app.serverData.files;
    $(".linerapp-docs").remove();

    this.lastWrapper = $(".card-fields__fields-block");
    this.allWrapper = $(".linked-forms__group-wrapper.linked-forms__group-wrapper_main.js-cf-group-wrapper,.forms__group-wrapper_main");
    this.allFields = $(".card-entity-form__main-fields.js-card-main-fields,  #statistic, .card-fields__linked-block-item_companies-contacts");

    // Создаем объект app.wrapper
    this.app.wrapper = $(this.elemetsHTML.wrapper)
        .insertAfter(this.lastWrapper)
        .hide();
    $(this.elemetsHTML.style).appendTo(this.app.wrapper);

    // Создаем объект app.header - контейнре шапки
    this.app.header = $(this.elemetsHTML.header).appendTo(this.app.wrapper);

    // Создаем объект app.title - контейнре заголовка
    this.app.title = $(this.elemetsHTML.title)
        .appendTo(this.app.header)
        .css({
          "backgroundColor": "#4D85E6",
          "padding": "22px",
          "color": "#fff"
        });


    // Создаем объект app.tabsControl - контейнре контрольных кнопок
    this.app.tabsControl = $(this.elemetsHTML.tabsControl)
        .appendTo(this.app.header)
        .css({
          "padding": "15px",
          "textAlign": "right"
        });

    // Создаем объект app.tabs.addFile - кнопка добавить новый файл
    this.app.tabs.addFile = $(this.elemetsHTML.tabs.addFile).appendTo(this.app.tabsControl);
    this.app.tabs.addFile["statusPosition"] = false;
    // Создаем контейнер добавление нового файла
    this.app.containAddFile.wrapper = $(this.elemetsHTML.containAddFile.wrapper).appendTo(this.app.tabsControl);
    var addForm = this.app.containAddFile.form = $(this.elemetsHTML.containAddFile.form).appendTo(this.app.containAddFile.wrapper);
    var addTable = $(this.elemetsHTML.containAddFile.table).appendTo(addForm).find("tbody tr.linerapp-container-form");

    this.app.containAddFile.dropZone = $(this.elemetsHTML.containAddFile.dropZone).appendTo(addForm);
    this.app.containAddFile.inputFile = this.app.containAddFile.dropZone.find("input[type='file']");


    // Создаем кнопки
    this.app.containAddFile.fields.typeFile = $(this.elemetsHTML.containAddFile.fields.typeFile).appendTo(addTable);
    this.app.containAddFile.fields.nameFile = $(this.elemetsHTML.containAddFile.fields.nameFile).appendTo(addTable).find("input");
    this.app.containAddFile.fields.dateFile = $(this.elemetsHTML.containAddFile.fields.dateFile).appendTo(addTable);


    // Добавление списка типов
    var listSelectFolders = self.app.twig({ref: '/tmpl/controls/select.twig'}).render({
      name: '',
      selected: 0,
      items: self.app.serverData.types,
      id: 'linerapp-field-type',
      class_name: '',
      required: true
    });
    $(this.app.containAddFile.fields.typeFile).append(listSelectFolders);

    var tplListTypes = self.app.twig({ref: '/tmpl/controls/date_field.twig'}).render({
      name: '',
      id: 'linerapp-field-date',
      value: "",
      class_name: '',
      required: true
    });

    $(this.app.containAddFile.fields.dateFile).append(tplListTypes);
    $("#linerapp-field-date").attr('required', "");
    $("#linerapp-field-date").attr('autocomplete', "off");

    //linerapp-field-date


    // Создаем объект списка файлов
    this.app.list.wrapper = $(this.elemetsHTML.list.wrapper).appendTo(this.app.wrapper);
    this.app.list.title = $(this.elemetsHTML.list.title).appendTo(this.app.list.wrapper);
    this.app.list.content = $(this.elemetsHTML.list.content).appendTo(this.app.list.wrapper);
    this.app.list.content.append("<table></table>");
    this.app.list.content.find("table").append(this.elemetsHTML.list.header);

    if (typeof this.google.listFiles != "undefined" && this.google.listFiles) {
      for (var arFileId in this.google.listFiles) {
        this.elemetsHTML.list.item(this.google.listFiles[arFileId]);
      }
    }
    this.open();
    this.toggleForm();
    this.initForm();
    this.delBlock();

  };


  /**
   * Открытие виджета
   */
  this.open = function() {
    this.allWrapper = $(".linked-forms__group-wrapper.linked-forms__group-wrapper_main.js-cf-group-wrapper,.forms__group-wrapper_main");
    this.allFields = $(".card-entity-form__main-fields.js-card-main-fields,  #statistic, .card-fields__linked-block-item_companies-contacts");
    setTimeout(function() {
      self.allWrapper.hide();
      self.allFields.hide();
    }, 100);
    $("span:contains('Прикрепленные документы')").parent("div").next("div").find("input").attr("readonly", "");
    this.app.wrapper.show();
    this.upload();
  };

  this.close = function() {
    $("span:contains('Прикрепленные документы')").parent("div").next("div").find("input").attr("readonly", "");
    $(".linerapp-docs").remove();
  };


  /**
   * Скрытие/раскрытие формы добавление файлов
   */
  this.toggleForm = function() {
    this.app.tabs.addFile.click(function() {
      if (!this.statusPosition) {
        self.app.containAddFile.wrapper.slideDown(300);
        $(this).find("span > span").html("Отмена");
        this.statusPosition = true;
      } else {
        self.app.containAddFile.wrapper.slideUp(300, function() {
          self.render(self.app.serverData);
        });
        $(this).find("span > span").html("Добавить документ");
        this.statusPosition = false;
      }
    });
  };

  /**
   * Инициализация формы
   */
  this.initForm = function() {

    /**
     * Обработчик dropZone
     */
    this.app.containAddFile.dropZone.bind('dragenter dragover dragleave drop', function(e) {
      e = e || e.window;
      var file;
      if (typeof e.originalEvent.dataTransfer.items != "undefined" && e.originalEvent.dataTransfer.items) {
        for (var i = 0; i < e.originalEvent.dataTransfer.items.length; i++) {
          if (e.originalEvent.dataTransfer.items[i].kind === 'file') {
            file = e.originalEvent.dataTransfer.items[i].getAsFile();
            if (typeof file != "undefined" && file) {
              self.form.files[file.name] = file;
              self.form.isFile++;
            }
          }
          //self.renderAddFile();
        }
      } else if (typeof e.originalEvent.dataTransfer.files != "undefined" && e.originalEvent.dataTransfer.files) {
        for (var i2 = 0; i2 < e.originalEvent.dataTransfer.files.length; i2++) {
          file = e.originalEvent.dataTransfer.files[i2];
          if (typeof file != "undefined" && file) {
            //console.log(file);
            self.form.files[file.name] = file;
            self.form.isFile++;
          }
        }
        //self.renderAddFile();
      }
      e.preventDefault();
      return false;
    });


    this.app.containAddFile.dropZone.bind('drop', function(e) {
      self.renderAddFile();
      e.preventDefault();
      return false;
    });

    // Обработчик input[type=file]
    this.app.containAddFile.dropZone.find("#linerapp-field-file").change(function() {
      if (typeof this.files != "undefined") {
        if (this.files.length > 0) {
          for (var i = 0; i < this.files.length; i++) {
            self.form.files[this.files[i].name] = this.files[i];
            self.form.isFile++;
          }
          self.renderAddFile();
        }
      }
    });
  };


  /**
   * Рендер добавляемых файлов
   */
  this.renderAddFile = function() {
    self.app.containAddFile.dropZone.next(".linerapp-upload-list").find("ul").html("");
    for (var key in this.form.files) {
      self.app.containAddFile.dropZone.next(".linerapp-upload-list").find("ul")
          .append('<li><b>' + self.form.files[key].name + '</b><span><span data-name-file="' + self.form.files[key].name + '" class="linerapp-del icon icon-delete-trash"></span></span></li>');
    }

    $(".linerapp-del").click(function() {
      var keyFile = $(this).attr("data-name-file");
      delete self.form.files[keyFile];
      self.form.isFile--;
      $(this).parents("li").remove();
    });

  };

  this.delBlock = function() {
    $(".linerapp-del-block").click(function() {
      if (confirm("Вы уверены что хотите удалить документ?")) {
        var loader = $(self.elemetsHTML.loader).appendTo("body");
        var sURL = $(this).attr("href");
        $.get(sURL, function(data) {
          console.log(data); // TODO обработчик всплыающего окна
          self.app.serverData = false;
          self.getData();
          var id = $(this).attr("data-block-id") - 0;
          $("#linerapp-block-" + id).remove();
          loader.remove();
        });

      }
      return false;
    });
  };


  this.upload = function() {
    this.app.containAddFile.form.submit(function() {
      return false;
    });

    this.app.containAddFile.form.submit(function() {
      if (self.form.isFile > 0) {
        var loader = $(self.elemetsHTML.loader).appendTo("body");
        var xhr = new XMLHttpRequest();
        var fd = new FormData;
        for (var file in self.form.files) {
          fd.append("linerapp-files[]", self.form.files[file]);
        }
        fd.append("subdomain", AMOCRM.constant('account').subdomain);
        fd.append("id_amo", AMOCRM.data.current_card.id);
        fd.append("name", $("#linerapp-field-name").val());
        fd.append("type", $("#linerapp-field-type").val());
        fd.append("date", $("#linerapp-field-date").val());
        fd.append("user", AMOCRM.constant('user')["id"]);
        $.ajax({
          type: "POST",
          url: self.httpServer + '/docs/upload',
          data: fd,
          processData: false,
          contentType: false,
          success: function() {
            self.form.isFile = 0;
            self.app.serverData = false;
            self.form.files = [];
            self.getData();
            loader.remove();
          }
        });
        /*
         //xhr.upload.addEventListener('progress', uploadProgress, false);
         //xhr.onreadystatechange = stateChange;
         xhr.open('POST', self.httpServer+'/docs/upload');
         xhr.setRequestHeader('X-FILE-NAME', 'file.name');

         xhr.send(fd);*/
      } else {
        alert("Выберите файлы для загрузки");
      }
      return false;
    });

  };

  // end class
}
