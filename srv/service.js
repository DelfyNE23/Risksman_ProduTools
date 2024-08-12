// Imports 
const cds = require("@sap/cds");
/** * The service implementation with all service handlers */
module.exports = cds.service.impl(async function () {
    // Define constants for the Risk andA_BusinessPartner entities from the risk-service.cds file 
    const { Risks,A_BusinessPartner } = this.entities;
    /** * Set criticality after a READ operation on /risks */
    this.after("READ", Risks, (data) => {
        const risks = Array.isArray(data) ? data : [data];
        risks.forEach((risk) => {
            if (risk.impact >= 100000) {
                risk.criticality = 1;
            } else {
                risk.criticality = 2;
            }
        });
    });

    // connect to remote service 
    const Suppliersrv = await cds.connect.to("BusinessPartnerA2X");
    /** * Event-handler for read-events on theA_BusinessPartner entity. 
     * * Each request to the API Business Hub requires the apikey in the header. */
    this.on("READ",A_BusinessPartner, async (req) => {
        // The API Sandbox returns alot of business partners with empty names. // We don't want them in our application 
        req.query.where("LastName <> '' and FirstName <> '' ");
        req.query.SELECT.count = false;  //añadido para resolver error count en fiori preview
        return await Suppliersrv.transaction(req).send({
            query: req.query,
            headers: {
                apikey: process.env.apikey,
            },
        });
    });


    /** * Event-handler on risks. * Retrieve BusinessPartner data from the external API */
    this.on("READ", Risks, async (req, next) => {
        /* Check whether the request wants an "expand" of the business partner As this is not possible, 
        the risk entity and the business partner entity are in different systems (SAP BTP and S/4 HANA Cloud), 
        if there is such an expand, remove it */

        if (!req.query.SELECT.columns)
            return next();
        const expandIndex = req.query.SELECT.columns.findIndex(
            ({ expand, ref }) => expand && ref[0] === "Supplier"
        );
        console.log(req.query.SELECT.columns);
        if (expandIndex < 0)
            return next();

        req.query.SELECT.columns.splice(expandIndex, 1);
        if (!req.query.SELECT.columns.find((column) => column.ref.find((ref) => ref == "Supplier_BusinessPartner"))) {
            req.query.SELECT.columns.push({ ref: ["Supplier_BusinessPartner"] });
        }
        /* Instead of carrying out the expand, issue a separate request for
            each business partner This code could be optimized, instead of having
             n requests for n business partners, just one bulk request could be created */
        try {
            res = await next();
            res = Array.isArray(res) ? res : [res];
            await Promise.all(
                res.map(async (risk) => {
                    const Supplier = await Suppliersrv.transaction(req).send(
                    { 
                        query: SELECT.one(this.entities.BusinessPartners)
                        .where({ BusinessPartner: risk.Supplier_BusinessPartner })
                        .columns(["BusinessPartner", "LastName", "FirstName"]),
                         headers: { 
                            apikey: process.env.apikey, 
                        }, 
                    }
                ); 
                risk.Supplier = Supplier;
            }));
        } catch (error) { }
    });

});