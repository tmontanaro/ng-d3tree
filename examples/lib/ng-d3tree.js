( function () {
	'use strict';

	var hasPropertiesOtherThan = function(obj, propertyNames) {

		var propertyName, key;

		if (!propertyNames)
		{
			propertyNames = [];
		}

		if (obj) {

			for (key in obj) {
				if (propertyNames.indexOf(key) == -1)
				{
					propertyName = key;
					break;
				}
			}

		}

		return propertyName;
	};

	var getNodeText = function(d, labelMap) {

		var text;

		if (d.label) 
		{
			var nodeKey;

			if (labelMap)
			{
				if (labelMap.hasOwnProperty(d.label))
				{
					nodeKey = labelMap[d.label];
				}        
			}

			if (d.hasOwnProperty(nodeKey))
			{
				text = d.label.concat(":", d[nodeKey]);
			}
			else if (hasPropertiesOtherThan(d, ["id", "label"]))
			{
				nodeKey = hasPropertiesOtherThan(d, ["id", "label"]);
				text = d.label.concat(":", d[nodeKey]);
			}
			else 
			{
				nodeKey = hasPropertiesOtherThan(d);
				text = d.label.concat(":", d[nodeKey]);
			}
		}
		else
		{
			if (hasPropertiesOtherThan(d, "id"))
			{
				nodeKey = hasPropertiesOtherThan(d, ["id"]);
				text = d[nodeKey];
			}
			else 
			{
				nodeKey = hasPropertiesOtherThan(d);
				text = d[nodeKey];
			}
		}

		return text;


	};

	angular.module('ngD3tree',[])
	.directive('reingoldTilfordTree', function($parse, $window){
		return{
			restrict:'EA',
			scope: {
				data: '=',
				labelMap: '=',
				jsonPath: '@',
				width: '@',
				height: '@',
				id: '@'
			},
			template:"<svg></svg>",
			link: function(scope, elem, attrs){
				var width = scope.width,
				height = scope.height;

				var labelMap = scope.labelMap;

				var d3 = $window.d3;

				var tree = d3.layout.tree()
				.size([height, width - 160]);


				var rawSvg=elem.find('svg');
				var svg = d3.select(rawSvg[0])
				.attr("width", width)
				.attr("height", height)
				.append("g")
				.attr("transform", "translate(40,0)");

				var diagonal = d3.svg.diagonal()
				.projection(function(d) { return [d.y, d.x]; });

				// define render function
				var render = function(json){
					// remove all previous items before render
					svg.selectAll("*").remove();

					var nodes = tree.nodes(json),
					links = tree.links(nodes);

					var link = svg.selectAll("path.link")
					.data(links)
					.enter().append("path")
					.attr("class", "link")
					.attr("d", diagonal);

					var node = svg.selectAll("g.node")
					.data(nodes)
					.enter().append("g")
					.attr("class", "node")
					.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })

					node.append("circle")
					.attr("r", 4.5);

					node.append("text")
					.attr("dx", function(d) { return d.children ? -8 : 8; })
					.attr("dy", 3)
					.attr("text-anchor", function(d) { return d.children ? "end" : "start"; })
					.text(function(d) 
							{
						return getNodeText(d, labelMap);
							});

				}

				if (scope.jsonPath) 
				{
					// load graph (nodes,links) json from /graph endpoint
					d3.json(scope.jsonPath, function(error, json) {
						if (error) 
						{
							console.error(error);
							return;
						}

						render(json);
					});
				}
				else
				{
					// watch for data changes and re-render
					scope.$watch('data', function(newVals, oldVals) {

						if (newVals) 
						{
							return render(newVals);
						}
					}, true);

//					watch for data changes and re-render
//					scope.$watch(watchNode, function() {

//					if (scope.data) {
//					return render(scope.data);  
//					}

//					}, true);

//					function watchNode() {
//					return scope.data;
//					};              

				}

				d3.select(self.frameElement).style("height", height + "px");

			}
		};
	})
	.directive('stickyForceLayout', function($parse, $window){
		return{
			restrict:'EA',
			scope: {
				data: '=',
				labelMap: '=',
				jsonPath: '@',
				width: '@',
				height: '@',
				id: '@'
			},
			template:"<svg></svg>",
			link: function(scope, elem, attrs){
				var width = scope.width,
				height = scope.height;

				var labelMap = scope.labelMap;

				var d3 = $window.d3;

				var rawSvg=elem.find('svg');
				var svg = d3.select(rawSvg[0])
				.attr("width", width)
				.attr("height", height)
				.append("g")
				.attr("transform", "translate(40,0)");

				// define render function
				var render = function(json){

					// remove all previous items before render
					svg.selectAll("*").remove();

					var force = d3.layout.force()
					.nodes(json.nodes)
					.links(json.links)                
					.size([width, height])
					.charge(-200)
					.linkDistance(width/10)
					.start();

					var drag = force.drag()
					.on("dragstart", dragstart);

					// render relationships as lines
					var link = svg.selectAll("line.link")
					.data(json.links).enter()
					.append("line").attr("class", "link");

					var node = svg.selectAll("g.node")
					.data(json.nodes).enter().append("g")
					.attr("class", "stickynode")
					.on("dblclick", dblclick)
					.call(drag);

					node.append("text")
					.attr("class", "stickynodetext")
					.attr("dx", 18)
					.attr("dy", ".35em")
					.text(function(d) 
							{
						return getNodeText(d, labelMap);
							});

					node.append("circle")
					.attr("r", 10);

					// force feed algo ticks for coordinate computation
					force.on("tick", function() {
						link.attr("x1", function(d) { return d.source.x; })
						.attr("y1", function(d) { return d.source.y; })
						.attr("x2", function(d) { return d.target.x; })
						.attr("y2", function(d) { return d.target.y; });


						node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
					});
				};

				var dblclick = function(d) {
					d3.select(this).classed("fixed", d.fixed = false);
				};

				var dragstart = function(d) {
					d3.select(this).classed("fixed", d.fixed = true);
				};

				if (scope.jsonPath) 
				{
					// load graph (nodes,links) json from /graph endpoint
					d3.json(scope.jsonPath, function(error, json) {
						if (error) 
						{
							console.error(error);
							return;
						}

						render(json);
					});
				}
				else
				{
					// watch for data changes and re-render
					scope.$watch('data', function(newVals, oldVals) {

						if (newVals) 
						{
							return render(newVals);
						}
					}, true);              
				}

			}
		};
	})
	.directive('collapsibleTree', function($parse, $window){
		return{
			restrict:'EA',
			scope: {
				data: '=',
				labelMap: '=',
				jsonPath: '@',
				width: '@',
				height: '@',
				id: '@'
			},
			template:"<svg></svg>",
			link: function(scope, elem, attrs){

				var margin = {top: 20, right: 120, bottom: 20, left: 120},
				width = 960 - margin.right - margin.left,
				height = 800 - margin.top - margin.bottom;

				var labelMap = scope.labelMap;

				var d3 = $window.d3;

				var i = 0,
				duration = 500,
				root;

				var tree = d3.layout.tree()
				.size([height, width]);

				var diagonal = d3.svg.diagonal()
				.projection(function(d) { return [d.y, d.x]; });

				var rawSvg=elem.find('svg');
				var svg = d3.select(rawSvg[0])
				.attr("width", width + margin.right + margin.left)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

				var update = function (source) {

					// Compute the new tree layout.
					var nodes = tree.nodes(root).reverse(),
					links = tree.links(nodes);

					// Normalize for fixed-depth.
					nodes.forEach(function(d) { d.y = d.depth * 180; });

					// Update the nodes…
					var node = svg.selectAll("g.node")
					.data(nodes, function(d) { return d.id || (d.id = ++i); });

					// Enter any new nodes at the parent's previous position.
					var nodeEnter = node.enter().append("g")
					.attr("class", "node")
					.attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
					.on("click", click);

					nodeEnter.append("circle")
					.attr("r", 1e-6)
					.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

					nodeEnter.append("text")
					.attr("x", function(d) { return d.children || d._children ? -10 : 10; })
					.attr("dy", ".35em")
					.attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
					.text(function(d) { return getNodeText(d, labelMap); })
					.style("fill-opacity", 1e-6);

					// Transition nodes to their new position.
					var nodeUpdate = node.transition()
					.duration(duration)
					.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

					nodeUpdate.select("circle")
					.attr("r", 4.5)
					.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

					nodeUpdate.select("text")
					.style("fill-opacity", 1);

					// Transition exiting nodes to the parent's new position.
					var nodeExit = node.exit().transition()
					.duration(duration)
					.attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
					.remove();

					nodeExit.select("circle")
					.attr("r", 1e-6);

					nodeExit.select("text")
					.style("fill-opacity", 1e-6);

					// Update the links…
					var link = svg.selectAll("path.link")
					.data(links, function(d) { return d.target.id; });

					// Enter any new links at the parent's previous position.
					link.enter().insert("path", "g")
					.attr("class", "link")
					.attr("d", function(d) {
						var o = {x: source.x0, y: source.y0};
						return diagonal({source: o, target: o});
					});

					// Transition links to their new position.
					link.transition()
					.duration(duration)
					.attr("d", diagonal);

					// Transition exiting nodes to the parent's new position.
					link.exit().transition()
					.duration(duration)
					.attr("d", function(d) {
						var o = {x: source.x, y: source.y};
						return diagonal({source: o, target: o});
					})
					.remove();

					// Stash the old positions for transition.
					nodes.forEach(function(d) {
						d.x0 = d.x;
						d.y0 = d.y;
					});
				}

				// Toggle children on click.
				var click = function(d) {
					if (d.children) {
						d._children = d.children;
						d.children = null;
					} else {
						d.children = d._children;
						d._children = null;
					}
					update(d);
				};

				var collapse = function(d) {
					if (d.children) {
						d._children = d.children;
						d._children.forEach(collapse);
						d.children = null;
					}
				};

				// define render function
				var render = function(json){
					root = json;
					root.x0 = height / 2;
					root.y0 = 0;

					json.children.forEach(collapse);
					update(json);
				}

				if (scope.jsonPath) 
				{
					// load graph (nodes,links) json from /graph endpoint
					d3.json(scope.jsonPath, function(error, json) {
						if (error) 
						{
							console.error(error);
							return;
						}

						render(json);
					});
				}
				else
				{
					// watch for data changes and re-render
					scope.$watch('data', function(newVals, oldVals) {
						if (newVals) 
						{
							return render(newVals);
						}
					}, true);              
				}

				d3.select(self.frameElement).style("height", height + "px");

			}
		};
	})
	.directive('radialCluster', function($parse, $window){
		return{
			restrict:'EA',
			scope: {
				data: '=',
				labelMap: '=',
				jsonPath: '@',
				radius: '@',
				id: '@'
			},
			template:"<svg></svg>",
			link: function(scope, elem, attrs){
				var radius = scope.radius;

				var labelMap = scope.labelMap;

				var d3 = $window.d3;

				var cluster = d3.layout.cluster()
				.size([360, radius - 120]);


				var rawSvg=elem.find('svg');
				var svg = d3.select(rawSvg[0])
				.attr("width", radius * 2)
				.attr("height", radius * 2)
				.append("g")
				.attr("transform", "translate(" + radius + "," + radius + ")");

				var diagonal = d3.svg.diagonal.radial()
				.projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });

				// define render function
				var render = function(json){
					// remove all previous items before render
					svg.selectAll("*").remove();

					var nodes = cluster.nodes(json),
					links = cluster.links(nodes);

					var link = svg.selectAll("path.link")
					.data(links)
					.enter().append("path")
					.attr("class", "link")
					.attr("d", diagonal);

					var node = svg.selectAll("g.node")
					.data(nodes)
					.enter().append("g")
					.attr("class", "node")
					.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; });


					node.append("circle")
					.attr("r", 4.5);

					node.append("text")
					.attr("dy", ".31em")
					.attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
					.attr("transform", function(d) { return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)"; })
					.text(function(d) { return getNodeText(d, labelMap); });

				}

				if (scope.jsonPath) 
				{
					// load graph (nodes,links) json from /graph endpoint
					d3.json(scope.jsonPath, function(error, json) {
						if (error) 
						{
							console.error(error);
							return;
						}

						render(json);
					});
				}
				else
				{
					// watch for data changes and re-render
					scope.$watch('data', function(newVals, oldVals) {

						if (newVals) 
						{
							return render(newVals);
						}
					}, true);              
				}

				d3.select(self.frameElement).style("height", radius * 2 + "px");

			}
		};
	})
	.directive('forceLayout', function($parse, $window){
		return{
			restrict:'EA',
			scope: {
				data: '=',
				labelMap: '=',
				jsonPath: '@',
				width: '@',
				height: '@',
				id: '@'
			},
			template:"<svg></svg>",
			link: function(scope, elem, attrs){
				var width = scope.width,
				height = scope.height;

				var labelMap = scope.labelMap;

				var d3 = $window.d3;

				var rawSvg=elem.find('svg');
				var svg = d3.select(rawSvg[0])
				.attr("width", width)
				.attr("height", height)
				.append("g")
				.attr("pointer-events", "all");

				// define render function
				var render = function(json){
					console.log("json");
					console.log(json);

					// remove all previous items before render
					svg.selectAll("*").remove();

					var force = d3.layout.force()
					.nodes(json.nodes)
					.links(json.links)
					.gravity(.05)
					.linkDistance(width/10)
					.charge(-100)
					.size([width, height])
					.start();

					// render relationships as lines
					var link = svg.selectAll("line.link")
					.data(json.links).enter()
					.append("line").attr("class", "link");


					// render nodes as circles, css-class from label
					var node = svg.selectAll("g.node")
					.data(json.nodes).enter().append("g")
					.attr("class", "node")
					.call(force.drag);

					node.append("text")
					.attr("class", "nodetext")
					.attr("dx", 12)
					.attr("dy", ".35em")
					.text(function(d) { return getNodeText(d, labelMap); });

					node.append("circle")
					.attr("r", 4.5);

					// force feed algo ticks for coordinate computation
					force.on("tick", function() {
						link.attr("x1", function(d) { return d.source.x; })
						.attr("y1", function(d) { return d.source.y; })
						.attr("x2", function(d) { return d.target.x; })
						.attr("y2", function(d) { return d.target.y; });

						node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
					});
				};

				if (scope.jsonPath) 
				{
					// load graph (nodes,links) json from /graph endpoint
					d3.json(scope.jsonPath, function(error, json) {
						if (error) 
						{
							console.error(error);
							return;
						}
						render(json);
					});
				}
				else
				{
					// watch for data changes and re-render
					scope.$watch('data', function(newVals, oldVals) {
						if (newVals) 
						{
							return render(newVals);
						}
					}, true);              

				}

				d3.select(self.frameElement).style("height", height + "px");
			}
		};
	})
	.directive('dragAndDropCollapsible', function($parse, $window){
		//introduced by Teodoro Montanaro - Github: @tmontanaro (16/01/2018)
		return{
			restrict:'EA',
			scope: {
				data: '=',
				labelMap: '=',
				jsonPath: '@',
				width: '@',
				height: '@',
				id: '@'
			},
			template:"<svg></svg>",
			link: function(scope, elem, attrs){
				var width = scope.width,
				height = scope.height;

				var labelMap = scope.labelMap;

				var d3 = $window.d3;

				var tree = d3.layout.tree()
				.size([height, width - 160]);


				// Calculate total nodes, max label length
				var totalNodes = 0;
				var maxLabelLength = 0;
				// variables for drag/drop
				var selectedNode = null;
				var draggingNode = null;
				// panning variables
				var panSpeed = 200;
				var panBoundary = 20; // Within 20px from edges will pan when dragging.
				// Misc. variables
				var i = 0;
				var duration = 750;
				var root;

				// size of the diagram
				var viewerWidth = width;
				var viewerHeight = height;

				var dragStarted = null;
				var nodes = null;
				var links = null;


				// define render function
				var render = function(json){


					var endDrag = function(domNode) {
						selectedNode = null;
						d3.selectAll('.ghostCircle').attr('class', 'ghostCircle');
						d3.select(domNode).attr('class', 'node');
						// now restore the mouseover event or we won't be able to drag a 2nd time
						d3.select(domNode).select('.ghostCircle').attr('pointer-events', '');
						updateTempConnector();
						if (draggingNode !== null) {
							update(root);
							centerNode(draggingNode);
							draggingNode = null;
						}
					}

					// Helper functions for collapsing and expanding nodes.

					var collapse = function(d) {
						if (d.children) {
							d._children = d.children;
							d._children.forEach(collapse);
							d.children = null;
						}
					}

					var expand = function(d) {
						if (d._children) {
							d.children = d._children;
							d.children.forEach(expand);
							d._children = null;
						}
					}

					var overCircle = function(d) {
						selectedNode = d;
						updateTempConnector();
					};
					var outCircle = function(d) {
						selectedNode = null;
						updateTempConnector();
					};

					// Function to update the temporary connector indicating dragging affiliation
					var updateTempConnector = function() {
						var data = [];
						if (draggingNode !== null && selectedNode !== null) {
							// have to flip the source coordinates since we did this for the existing connectors on the original tree
							data = [{
								source: {
									x: selectedNode.y0,
									y: selectedNode.x0
								},
								target: {
									x: draggingNode.y0,
									y: draggingNode.x0
								}
							}];
						}
						var link = svgGroup.selectAll(".templink").data(data);

						link.enter().append("path")
						.attr("class", "templink")
						.attr("d", d3.svg.diagonal())
						.attr('pointer-events', 'none');

						link.attr("d", d3.svg.diagonal());

						link.exit().remove();
					};

					// Function to center node when clicked/dropped so node doesn't get lost when collapsing/moving with large amount of children.

					var centerNode = function(source) {
						var scale = zoomListener.scale();
						var x = -source.y0;
						var y = -source.x0;
						x = x * scale + viewerWidth / 2;
						y = y * scale + viewerHeight / 2;
						d3.select('g').transition()
						.duration(duration)
						.attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
						zoomListener.scale(scale);
						zoomListener.translate([x, y]);
					}

					// Toggle children function

					var toggleChildren = function(d) {
						if (d.children) {
							d._children = d.children;
							d.children = null;
						} else if (d._children) {
							d.children = d._children;
							d._children = null;
						}
						return d;
					}

					// Toggle children on click.

					var click = function(d) {
						if (d3.event.defaultPrevented) return; // click suppressed
						d = toggleChildren(d);
						update(d);
						centerNode(d);
					}

					// define a d3 diagonal projection for use by the node paths later on.
					var diagonal = d3.svg.diagonal()
					.projection(function(d) {
						return [d.y, d.x];
					});

					// A recursive helper function for performing some setup by walking through all nodes

					function visit(parent, visitFn, childrenFn) {
						if (!parent) return;

						visitFn(parent);

						var children = childrenFn(parent);
						if (children) {
							var count = children.length;
							for (var i = 0; i < count; i++) {
								visit(children[i], visitFn, childrenFn);
							}
						}
					}


					// TODO: Pan function, can be better implemented.
					function pan(domNode, direction) {
						var speed = panSpeed;
						if (panTimer) {
							clearTimeout(panTimer);
							translateCoords = d3.transform(svgGroup.attr("transform"));
							if (direction == 'left' || direction == 'right') {
								translateX = direction == 'left' ? translateCoords.translate[0] + speed : translateCoords.translate[0] - speed;
								translateY = translateCoords.translate[1];
							} else if (direction == 'up' || direction == 'down') {
								translateX = translateCoords.translate[0];
								translateY = direction == 'up' ? translateCoords.translate[1] + speed : translateCoords.translate[1] - speed;
							}
							scaleX = translateCoords.scale[0];
							scaleY = translateCoords.scale[1];
							var scale = zoomListener.scale();
							svgGroup.transition().attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + scale + ")");
							d3.select(domNode).select('g.node').attr("transform", "translate(" + translateX + "," + translateY + ")");
							zoomListener.scale(zoomListener.scale());
							zoomListener.translate([translateX, translateY]);
							panTimer = setTimeout(function() {
								pan(domNode, speed, direction);
							}, 50);
						}
					}

					// Define the zoom function for the zoomable tree

					var zoom = function() {
						svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
					}


					// define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
					var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", zoom);

					function initiateDrag(d, domNode) {
						draggingNode = d;
						d3.select(domNode).select('.ghostCircle').attr('pointer-events', 'none');
						d3.selectAll('.ghostCircle').attr('class', 'ghostCircle show');
						d3.select(domNode).attr('class', 'node activeDrag');

						svgGroup.selectAll("g.node").sort(function(a, b) { // select the parent and sort the path's
							if (a.id != draggingNode.id) return 1; // a is not the hovered element, send "a" to the back
							else return -1; // a is the hovered element, bring "a" to the front
						});
						// if nodes has children, remove the links and nodes
						if (nodes.length > 1) {
							// remove link paths
							links = tree.links(nodes);
							nodePaths = svgGroup.selectAll("path.link")
							.data(links, function(d) {
								return d.target.id;
							}).remove();
							// remove child nodes
							nodesExit = svgGroup.selectAll("g.node")
							.data(nodes, function(d) {
								return d.id;
							}).filter(function(d, i) {
								if (d.id == draggingNode.id) {
									return false;
								}
								return true;
							}).remove();
						}

						// remove parent link
						var parentLink = tree.links(tree.nodes(draggingNode.parent));
						svgGroup.selectAll('path.link').filter(function(d, i) {
							if (d.target.id == draggingNode.id) {
								return true;
							}
							return false;
						}).remove();

						dragStarted = null;
					}


					var update = function(source) {
						// Compute the new height, function counts total children of root node and sets tree height accordingly.
						// This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
						// This makes the layout more consistent.
						var levelWidth = [1];
						var childCount = function(level, n) {

							if (n.children && n.children.length > 0) {
								if (levelWidth.length <= level + 1) levelWidth.push(0);

								levelWidth[level + 1] += n.children.length;
								n.children.forEach(function(d) {
									childCount(level + 1, d);
								});
							}
						};
						childCount(0, root);
						var newHeight = d3.max(levelWidth) * 25; // 25 pixels per line  
						tree = tree.size([newHeight, viewerWidth]);

						// Compute the new tree layout.
						nodes = tree.nodes(root).reverse();
						links = tree.links(nodes);

						// Set widths between levels based on maxLabelLength.
						nodes.forEach(function(d) {
							d.y = (d.depth * (maxLabelLength * 10)); //maxLabelLength * 10px
							// alternatively to keep a fixed scale one can set a fixed depth per level
							// Normalize for fixed-depth by commenting out below line
							// d.y = (d.depth * 500); //500px per level.
						});

						// Update the nodes…
						var node = svgGroup.selectAll("g.node")
						.data(nodes, function(d) {
							return d.id || (d.id = ++i);
						});

						// Enter any new nodes at the parent's previous position.
						var nodeEnter = node.enter().append("g")
						.call(dragListener)
						.attr("class", "node")
						.attr("transform", function(d) {
							return "translate(" + source.y0 + "," + source.x0 + ")";
						})
						.on('click', click);

						nodeEnter.append("circle")
						.attr('class', 'nodeCircle')
						.attr("r", 0)
						.style("fill", function(d) {
							return d._children ? "lightsteelblue" : "#fff";
						});

						nodeEnter.append("text")
						.attr("x", function(d) {
							return d.children || d._children ? -10 : 10;
						})
						.attr("dy", ".35em")
						.attr('class', 'nodeText')
						.attr("text-anchor", function(d) {
							return d.children || d._children ? "end" : "start";
						})
						.text(function(d) {
							return d.name;
						})
						.style("fill-opacity", 0);

						// phantom node to give us mouseover in a radius around it
						nodeEnter.append("circle")
						.attr('class', 'ghostCircle')
						.attr("r", 30)
						.attr("opacity", 0.2) // change this to zero to hide the target area
						.style("fill", "red")
						.attr('pointer-events', 'mouseover')
						.on("mouseover", function(node) {
							overCircle(node);
						})
						.on("mouseout", function(node) {
							outCircle(node);
						});

						// Update the text to reflect whether node has children or not.
						node.select('text')
						.attr("x", function(d) {
							return d.children || d._children ? -10 : 10;
						})
						.attr("text-anchor", function(d) {
							return d.children || d._children ? "end" : "start";
						})
						.text(function(d) {
							return d.name;
						});

						// Change the circle fill depending on whether it has children and is collapsed
						node.select("circle.nodeCircle")
						.attr("r", 4.5)
						.style("fill", function(d) {
							return d._children ? "lightsteelblue" : "#fff";
						});

						// Transition nodes to their new position.
						var nodeUpdate = node.transition()
						.duration(duration)
						.attr("transform", function(d) {
							return "translate(" + d.y + "," + d.x + ")";
						});

						// Fade the text in
						nodeUpdate.select("text")
						.style("fill-opacity", 1);

						// Transition exiting nodes to the parent's new position.
						var nodeExit = node.exit().transition()
						.duration(duration)
						.attr("transform", function(d) {
							return "translate(" + source.y + "," + source.x + ")";
						})
						.remove();

						nodeExit.select("circle")
						.attr("r", 0);

						nodeExit.select("text")
						.style("fill-opacity", 0);

						// Update the links…
						var link = svgGroup.selectAll("path.link")
						.data(links, function(d) {
							return d.target.id;
						});

						// Enter any new links at the parent's previous position.
						link.enter().insert("path", "g")
						.attr("class", "link")
						.attr("d", function(d) {
							var o = {
									x: source.x0,
									y: source.y0
							};
							return diagonal({
								source: o,
								target: o
							});
						});

						// Transition links to their new position.
						link.transition()
						.duration(duration)
						.attr("d", diagonal);

						// Transition exiting nodes to the parent's new position.
						link.exit().transition()
						.duration(duration)
						.attr("d", function(d) {
							var o = {
									x: source.x,
									y: source.y
							};
							return diagonal({
								source: o,
								target: o
							});
						})
						.remove();

						// Stash the old positions for transition.
						nodes.forEach(function(d) {
							d.x0 = d.x;
							d.y0 = d.y;
						});
					}
					// Call visit function to establish maxLabelLength
					visit(json, function(d) {
						totalNodes++;
						maxLabelLength = Math.max(d.name.length, maxLabelLength);

					}, function(d) {
						return d.children && d.children.length > 0 ? d.children : null;
					});


					// Append a group which holds all nodes and which the zoom Listener can act upon.
					var rawSvg=elem.find('svg');
					// remove all previous items before render
					d3.select(rawSvg[0]).selectAll("*").remove();
				    
					var baseSvg = d3.select(rawSvg[0])
					.attr("width", width)
					.attr("height", height)
					.attr("class", "overlay")
					.call(zoomListener);

					// Append a group which holds all nodes and which the zoom Listener can act upon.
					var svgGroup = baseSvg.append("g");

					// Define the drag listeners for drag/drop behaviour of nodes.
					var dragListener = d3.behavior.drag()
					.on("dragstart", function(d) {
						if (d == root) {
							return;
						}
						dragStarted = true;
						nodes = tree.nodes(d);
						d3.event.sourceEvent.stopPropagation();
						// it's important that we suppress the mouseover event on the node being dragged. Otherwise it will absorb the mouseover event and the underlying node will not detect it d3.select(this).attr('pointer-events', 'none');
					})
					.on("drag", function(d) {
						if (d == root) {
							return;
						}
						if (dragStarted) {
							var domNode = this;
							initiateDrag(d, domNode);
						}

						// get coords of mouseEvent relative to svg container to allow for panning
						relCoords = d3.mouse($('svg').get(0));
						if (relCoords[0] < panBoundary) {
							panTimer = true;
							pan(this, 'left');
						} else if (relCoords[0] > ($('svg').width() - panBoundary)) {

							panTimer = true;
							pan(this, 'right');
						} else if (relCoords[1] < panBoundary) {
							panTimer = true;
							pan(this, 'up');
						} else if (relCoords[1] > ($('svg').height() - panBoundary)) {
							panTimer = true;
							pan(this, 'down');
						} else {
							try {
								clearTimeout(panTimer);
							} catch (e) {

							}
						}

						d.x0 += d3.event.dy;
						d.y0 += d3.event.dx;
						var node = d3.select(this);
						node.attr("transform", "translate(" + d.y0 + "," + d.x0 + ")");
						updateTempConnector();
					}).on("dragend", function(d) {
						if (d == root) {
							return;
						}
						var domNode = this;
						if (selectedNode && draggingNode!=null) {
							// now remove the element from the parent, and insert it into the new elements children
							var index = draggingNode.parent.children.indexOf(draggingNode);
							if (index > -1) {
								draggingNode.parent.children.splice(index, 1);
							}
							if (typeof selectedNode.children !== 'undefined' || typeof selectedNode._children !== 'undefined') {
								if (typeof selectedNode.children !== 'undefined') {
									selectedNode.children.push(draggingNode);
								} else {
									selectedNode._children.push(draggingNode);
								}
							} else {
								selectedNode.children = [];
								selectedNode.children.push(draggingNode);
							}
							// Make sure that the node being added to is expanded so user can see added node is correctly moved
							expand(selectedNode);
							endDrag(domNode);
						} else {
							endDrag(domNode);
						}
					});

					// Define the root
					root = json;
					root.x0 = viewerHeight / 2;
					root.y0 = 0;

					// Collapse all children of roots children before rendering.
					root.children.forEach(function(child){
						collapse(child);
					});

					// Layout the tree initially and center on the root node.
					update(root);
					centerNode(root);

				}

				if (scope.jsonPath) 
				{
					// load graph (nodes,links) json from /graph endpoint
					d3.json(scope.jsonPath, function(error, json) {
						if (error) 
						{
							console.error(error);
							return;
						}

						render(json);
					});
				}
				else
				{
					// watch for data changes and re-render
					scope.$watch('data', function(newVals, oldVals) {

						if (newVals) 
						{
							return render(newVals);
						}
					}, true);             

				}

				d3.select(self.frameElement).style("height", height + "px");

			}
		};
	});
}() );
