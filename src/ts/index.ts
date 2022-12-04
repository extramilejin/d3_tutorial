import * as $ from 'jquery'
import * as d3 from 'd3'
import { BlobOptions } from 'buffer';

let mousedown: boolean = false;

document.addEventListener('mousedown', () => {
    mousedown = true;
});
document.addEventListener('mouseup', () => {
    mousedown = false;
});

let annotationLayer = document.getElementById("annotation-layer");
let markerLayer = document.getElementById("marker-layer");
const svgElms = markerLayer.getElementsByClassName("tmp-marker-svg");
const svgElm = svgElms[0] as SVGSVGElement;
let newSvg: d3.Selection<SVGElement, unknown, HTMLElement, any> = null;

let annotaionLayerSelection = d3.select(annotationLayer);
let svgElmSelection = d3.select(svgElm);
let annotationToggleBtn = document.getElementById("annotation-toggle")

let isDrawing: boolean = false;
let isAnnotationMode: boolean = false;

d3.select(annotationToggleBtn).on('click', function() {
    if (isAnnotationMode) {
        annotaionLayerSelection.style("z-index", 18);
        isAnnotationMode = false;
    } else {
        annotaionLayerSelection.style("z-index", 14);
        isAnnotationMode = true;
    }
})

svgElmSelection.on('mousedown', function() {
    markerStart(svgElmSelection, this);
})

markerEventBind(svgElmSelection);

function markerEventBind(svgSelection: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>): void {
    svgSelection.on('mousedown', function() {
        isDrawing = true;
        isDrawing && markerStart(svgSelection, this)
    });
    svgSelection.on('mouseup', function() {
        markerEnd(svgSelection, this)
        isDrawing = false;
    });
}

function markerDrawBind(svgSelection: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    markerEnd: (svgSelection: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>, svgElement: SVGSVGElement) => void,
    markerDrawTmp: () => void): void {
    console.log(d3.event.type);
    if (d3.event.type === 'mousedown') {
        svgSelection.on('mousemove', function () { markerDrawTmp() });
    } else if (d3.event.type === 'pointerdown') {
        svgSelection.on('pointermove', function () { markerDrawTmp() });
    } else {
        svgSelection.on('touchmove', function () {
            d3.event.preventDefault();
            const svgWidth = parseFloat(svgSelection.node().style.width);
            const svgHeight = parseFloat(svgSelection.node().style.height);
            const touch = d3.touches(this)[0];
            if (touch[0] < 0 || touch[0] > svgWidth || touch[1] < 0 || touch[1] > svgHeight) {
                markerEnd(svgSelection, this);
                return;
            }
            markerDrawTmp();
        });
    }
}

function markerEnd(svgSelection: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>, svgElement: SVGSVGElement): void {
    svgSelection.on('mousemove', null);
    isDrawing = false;
}

function markerStart(svgSelection: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>, svgElement: SVGSVGElement): void {
    // 다중 터치하여 그리는 것을 방지
    const _event: TouchEvent = event as TouchEvent;
    if(!!_event.touches && _event.touches.length > 1) {
        return;
    }
    // const svgSelectionId = Util.getParentElement(svgSelection.node()).id;
    // const pageOrSheetIdx = Util.getIdxFromElmId(svgSelectionId, 'marker-section');
    
    const m = d3.mouse(svgElement);
    console.log(`${m[0]} ${m[1]}`);
    newSvg = svgSelection.append('rect')
    .style('stroke', 'red')
    .style('stroke-width', '3')
    .style('opacity', 1)
    .style('fill', 'transparent')
    .attr('x', m[0])
    .attr('y', m[1])
    .attr('width', '100px')
    .attr('height', '30px')

    markerDrawBind(svgSelection, markerEnd, () => {markerDrawTmp(svgElement, m[0], m[1])});
}

function markerDrawTmp(svgElement: SVGSVGElement, x: number, y: number): void {
    const m = d3.mouse(svgElement);
    const width = Math.max(0, Math.abs(m[0]-x));
    const height = Math.max(0, Math.abs(m[1]-y));
    if(m[0]-x >= 0 && m[1]-y >= 0) { // 좌상단 -> 우하단
        newSvg.attr('width', width).attr('height', height);
    } else if(m[0]-x >= 0 && m[1]-y < 0) { // 좌하단 -> 우상단
        newSvg.attr('y', m[1]).attr('width', width).attr('height', height);
    } else if(m[0]-x < 0 && m[1]-y >= 0) { // 우상단 -> 좌하단
        newSvg.attr('x', m[0]).attr('width', width).attr('height', height);
    } else if(m[0]-x < 0 && m[1]-y < 0){ // 우히딘 -> 좌상단
        newSvg.attr('x', m[0]).attr('y', m[1]).attr('width', width).attr('height', height);
    }

    console.log(d3.event.type);
}

console.log(d3.select("annotaion-toggle"));