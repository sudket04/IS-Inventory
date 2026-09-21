namespace KKND.Api.Controllers.Relationships;

public sealed record AssetRelationshipItem(
    int RelationshipId, int FromAssetId, int ToAssetId, string Direction, string RelationshipName,
    string RelatedAssetTag, string RelatedAssetName, string RelatedStatusCode, string? Notes);

public sealed record AssetRelationshipRequest(int TargetAssetId, int RelationshipTypeId, string? Notes);
