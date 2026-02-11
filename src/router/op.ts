import { LocationQuery } from "vue-router";

function configOp(q: LocationQuery) {
    for (const key in q) {
        const val = typeof q[key] == 'string' ? q[key] : q[key]?.[0];
        if (undefined === val) continue;

        localStorage[key] = val;
    }
}

export default function routeOpHandler(q: LocationQuery, op: string){
    switch (op) {
        default:
            configOp(q);
    }
}