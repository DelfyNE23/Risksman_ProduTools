namespace RiskManagement;

using { BusinessPartnerA2X } from '../srv/external/BusinessPartnerA2X.cds';

entity A_BusinessPartner as
        projection on BusinessPartnerA2X.A_BusinessPartner {
            key BusinessPartner,
            Customer,
            Supplier,
            BusinessPartnerCategory,
            BusinessPartnerFullName,
            BusinessPartnerIsBlocked
        };

using { managed } from '@sap/cds/common';

entity Mitigations : managed
{
    key ID : UUID;
    description : String(100);
    owner : String(100);
    timeline : String(100);
    risks : Association to many Risks on risks.miti = $self;
}

entity Risks : managed
{
    key ID : UUID;
    title : String(100);
    prio : String(5);
    descr : String(100);
    impact : Integer;
    criticality : Integer;
    miti : Association to one Mitigations;
    Supplier : Association to one A_BusinessPartner; //BusinessPartnerA2X.A_BusinessPartner;
}
