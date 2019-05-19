function initRenderDist(arUsers) {
  var totalData = JSON.parse(arUsers);
  var arPipelines = totalData.data;
  var elem = {};
  var elRange = [];

  if (!totalData.field_my_lead) {
    $('<div class="btn-my-lead"><span>Создать поле "Моя сделка"</span><label class="linerapp_switch_label"><input id="add-field-my-lead" class="linerapp_switch_input" type="checkbox" name="add-field-my-lead" value="1"> <i></i></label></div>').appendTo(".mishanin-distribution");
  }

  for (var pipeline in arPipelines) {
    var arUsers = arPipelines[pipeline]["fields"];
    var currentPipelineItem = $('<div class="pipeline-item" id="item-' + pipeline + '"><h3 data-name="'+arPipelines[pipeline].name+'"><b>' + arPipelines[pipeline].name + '</b><span>Изменить параметры</span><div style="float: none; clear: both;"></div></h3></div>').appendTo(".mishanin-distribution");
    var currentPipelineContainer = $('<div class="pipeline-container"></div>').appendTo(currentPipelineItem);

    var considerationExpTasks = arPipelines[pipeline].considerationExpTasks ? " checked=''" : '';
    $('<div class="contain-buttons"><button id="pipeline-' + pipeline + '" class="range-evenly">Распределить поровну</button><div class="checked-task"><span>Учитывать просроченные задачи</span><label class="linerapp_switch_label"><input id="checked-'+pipeline+'" class="linerapp_switch_input" type="checkbox" '+considerationExpTasks+' name="checked_pipeline['+pipeline+']" value="1"> <i></i></label></div><div style="float: none; clear: both;"></div></div>').appendTo(currentPipelineContainer);



    var currentPipeline = $('<div class="pipeline-content" id="content-' + pipeline + '"></div>').appendTo(currentPipelineContainer);

    for (var userID in arUsers) {
      var currentUser = arUsers[userID];
      currentUser.rate = currentUser.rate ? currentUser.rate : 0;
      currentPipeline.append('<div class="item-range user-' + pipeline + '-' + userID + '"><b>' + currentUser.name + '</b><div style="width: 150px;">\
          <input id="user-' + pipeline + '-' + userID + '" class="js-range user-' + pipeline + '-' + userID + '"/>\
          </div><span><input type="text" class="mishanin-range-value user-' + pipeline + '-' + userID + '" value="' + currentUser.rate + '" /> %</span></div>');


      var $range = elRange[pipeline + '-' + userID] = $(document.querySelector(".js-range.user-" + pipeline + '-' + userID)).ionRangeSlider({
        type: "single",
        min: 0,
        max: 100,
        from: currentUser.rate,
        keyboard: true,
        hide_min_max: true,
        hide_from_to: true
      });
      elRange[pipeline + '-' + userID] = $range.data("ionRangeSlider");
      $('.item-range.user-' + pipeline + '-' + userID).find(".js-range").change(function() {
        var id = $(this).attr("id").replace("user-", "");
        $(".mishanin-range-value.user-" + id).val($(this).val());
      });

      $(".mishanin-range-value.user-" + pipeline + '-' + userID).change(function() {
        var id = $(this).attr("class").replace("mishanin-range-value user-", "");
        elRange[id].update({"from": $(this).val()});
      });
    }
  }

  $(".pipeline-item:eq(0)").addClass("selected");
  $(".pipeline-item h3").click(function() {
    var self = this;
    $(this).next(".pipeline-container:visible").slideUp(300, function() {
      $(self).parents(".pipeline-item").removeClass("selected");
    });
    $(this).next(".pipeline-container:hidden").slideDown(300, function() {
      $(self).parents(".pipeline-item").addClass("selected");
    });

  });

  $(".range-evenly").click(function() {
    var id = $(this).attr("id").replace("pipeline-", "");
    var count = $("#content-" + id).find(".js-range").length;
    var prco = (100 / count);

    $("#content-" + id).find(".mishanin-range-value").each(function(i) {
      var id = $(this).attr("class").replace("mishanin-range-value user-", "");
      $(this).val(Math.floor(prco));
      elRange[id].update({"from": Math.floor(prco)});
    });


  });
}

function valuesPipelines() {
  var pipeline = {};
  $(".mishanin-distribution .pipeline-item").each(function() {
    var pipelineID = $(this).attr("id").replace("item-", "") - 0;
    var pipelineName = $(this).find("h3").attr("data-name");
    var task = $("#checked-"+pipelineID+":checked").val() ? $("#checked-"+pipelineID+":checked").val() : 0;
    pipeline[pipelineID] = {"name": pipelineName, "considerationExpTasks": task, "fields": {}};
    $(this).find(".js-range").each(function() {
      var userID = $(this).attr("id").replace("user-" + pipelineID + "-", "");
      var name = $(".item-range.user-" + pipelineID + "-" + userID).find("b").html();
      pipeline[pipelineID]["fields"][userID] = {
        "name": name,
        "rate": $(this).val(),
        "id": userID
      };
    });
  });
  return pipeline;
}