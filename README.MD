# Angular Directives for d3 tree and graph with the addition of drag and drop, and collapsible d3.js Tree

This is a fork of the [ng-d3tree](https://github.com/komushi/ng-d3tree) repository obtaining by introducing and adapting the code taken here:
[Drag and drop, collapsible d3.js Tree with 50,000 nodes](http://bl.ocks.org/robschmuecker/7926762)

----------
Quick Start
-------------
### Install via Bower

```bash
bower install --save ng-d3tree-drag-drop-collapse
```


----------
Slow Start (install original Directive and them make changes
-------------
### Install via Bower

1. 
```bash
bower install --save ng-d3tree-drag-drop-collapse
```
2. Copy the content of the file `src/ng-d3tree.js` in the corresponding file in your project

3. Copy the content of the file `src/css/ng-d3tree.css` in the corresponding file in your project

4. Use these 2 files instead of the minified versions

### Usage
```
<!DOCTYPE html>
<html>

<head>
  <title>tree</title>

    <script src="https://code.angularjs.org/1.5.5/angular.js" data-semver="1.5.5" data-require="angularjs@1.5.5"></script>
    <script data-require="d3@*" data-semver="3.5.3" src="//cdnjs.cloudflare.com/ajax/libs/d3/3.5.3/d3.js"></script>
    <script type="text/javascript" src="https://rawgit.com/komushi/ng-d3tree/master/src/ng-d3tree.js"></script>

    <link rel="stylesheet" href="https://rawgit.com/komushi/ng-d3tree/master/src/css/ng-d3tree.css" />

</head>


<body ng-app="d3treeApp">

<script>
var app = angular.module("d3treeApp", ['ngD3tree']); 
app.controller("treeCtrl", ['$scope', '$http', function($scope, $http) {

  $http.get('data/data2.json')
       .success(function(res){
          $scope.d3json = res;
        });

}]);
</script>

<div ng-controller="treeCtrl">
  <h2>Reingold-Tilford Tree With Drag and Drop, and Collapsible tree</h2>
  <drag-and-drop-collapsible
    data="d3json"
    width="550"
    height="500"
    json-path="">
  </drag-and-drop-collapsible>
</div>


</body>
</html>
```

