// Triangulation blocks
//   All triangles from one vertex
//   N-shaped triangulations
//   Mirror N-shaped triangulation
//   Central triangle
var triangulations = [
    [[0,1,2],[0,2,3],[0,3,4],[0,4,5]],
    [[0,1,5],[1,2,3],[1,3,4],[1,4,5]],
    [[0,1,2],[0,2,5],[2,3,4],[2,4,5]],
    [[0,1,3],[1,2,3],[0,3,5],[3,4,5]],
    [[0,1,4],[1,2,4],[2,3,4],[0,4,5]],
    [[0,1,5],[1,2,5],[2,3,5],[3,4,5]],

    [[0,1,3],[1,2,3],[0,3,4],[0,4,5]],
    [[0,1,5],[1,2,4],[2,3,4],[1,4,5]],
    [[0,1,2],[0,2,5],[2,3,5],[3,4,5]],

    [[1,3,4],[1,2,3],[0,1,4],[0,4,5]],
    [[0,1,5],[1,2,5],[2,3,4],[2,4,5]],
    [[0,1,2],[0,3,5],[0,2,3],[3,4,5]],

    [[0,1,2],[0,2,4],[2,3,4],[0,4,5]],
    [[1,2,3],[0,1,5],[1,3,5],[3,4,5]]
    ];

var asschdron_faces = [
    [5, 8, 11, 3, 13],
    [1, 7, 10, 5, 13],
    [13, 3, 6, 9, 1],
    [3, 11, 0, 6],
    [0, 11, 8, 2, 12],
    [1, 9, 4, 7],
    [0, 12, 4, 9, 6],
    [10, 7, 4, 12, 2],
    [8, 5, 10, 2],
];

var asschdron_edges = [];
var diagonals = [];
var triangulation_faces = [];

var used = {}
for (var i = 0; i < asschdron_faces.length; i++) {
    var face = asschdron_faces[i];
    for (var j = 0; j < face.length; j++) {
        var first = face[j];
        var second = face[(j+1)%face.length];
        var key = Math.min(first,second) + 14*Math.max(first,second);

        if(!used[key]){
            used[key] = true;
            asschdron_edges.push(first, second);
        }
    }
}

for (var i = 0; i < asschdron_faces.length; i++) {
    var face = asschdron_faces[i];
    var cur_face_diags = [];
    for (var j = 0; j < face.length; j++) {
        var idx = face[j];
        var tring = triangulations[idx];
        triangulation_faces[idx] = triangulation_faces[idx] || [];
        triangulation_faces[idx].push(i);
        for (var k = 0; k < tring.length; k++) {
            var ctri = tring[k];
            for (var l = 0; l < 3; l++) {
                var a = ctri[l];
                var b = ctri[(l+1)%3];
                var key = Math.min(a,b) + 6*Math.max(a,b);
                cur_face_diags[key] = 1 + (cur_face_diags[key] || 0);
            }
        }
    }
    for (var j = 0; j < cur_face_diags.length; j++) {
        if(cur_face_diags[j] == 2*face.length){
            var a = j%6;
            var b = (j/6) | 0;
            diagonals[i] = [a,b];
        }
    }
}