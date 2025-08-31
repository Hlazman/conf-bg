import React, { useState, useEffect, useMemo, useContext } from "react";
import { Card, Row, Col, Typography, Spin, Empty, InputNumber, Button, message, Tabs, Divider, Select, Checkbox, Input } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";
import ArchiveOverlay from './ArchiveOverlay';

const { Title, Text } = Typography;
const { Option } = Select;

const baseUrl = process.env.REACT_APP_BASE_URL;

// --- GraphQL ---
const GET_PRODUCT_ELEMENTS = gql`
  query Products($pagination: PaginationArg, $filters: ProductFiltersInput) {
    products(pagination: $pagination, filters: $filters) {
      title
      archive
      type
      brand
      image { documentId url }
      parquetGrades { documentId title }
      parquetPrices { size }
      parquetModular
      documentId
    }
  }`;

const CREATE_SUBORDER_PRODUCT = gql`
  mutation CreateSuborderProduct($data: SuborderProductInput!) {
    createSuborderProduct(data: $data) { documentId }
  }`;

const UPDATE_SUBORDER_PRODUCT = gql`
  mutation UpdateSuborderProduct($documentId: ID!, $data: SuborderProductInput!) {
    updateSuborderProduct(documentId: $documentId, data: $data) { documentId }
  }`;

const GET_SUBORDER_PRODUCT = gql`
  query GetSuborderProduct($filters: SuborderProductFiltersInput) {
    suborderProducts(filters: $filters) {
      documentId
      product {
        documentId
        title
        image { documentId url }
        brand
        type
        parquetGrades { documentId title }
        parquetModular
        parquetPrices { size }
      }
      type
      sizes { height width }
      parquetLacquering
      parquetOiling
      parquetBrushing
      parquetSmoking
      parquetFixedLength
      parquetColoringVariants
      parquetColorTitle
      parquetColorLink
      parquet_grade { documentId title }
      parquetSize
    }
  }`;

const COLORING_VARIANTS = [
  "Mocha",
  "Wenge",
  "NorthPole",
  "Cappuccino",
  "PlayaJardin",
  "DarkWalnut",
  "GoldenOak",
  "Savanna",
  "standard"
];

const ParquetSelection = ({ suborderId, brand, onAfterSubmit }) => {
  const { translations } = useContext(LanguageContext);

  // Product filter checkboxes (Normal / Module)
  const [showNormal, setShowNormal] = useState(true);
  const [showModule, setShowModule] = useState(true);

  const [suborderProductId, setSuborderProductId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sizes, setSizes] = useState({ height: 0, width: 0 });
  const [squareMeters, setSquareMeters] = useState(0);

  // Decor-like options
  const [parquetLacquering, setParquetLacquering] = useState(false);
  const [parquetOiling, setParquetOiling] = useState(false);
  const [parquetBrushing, setParquetBrushing] = useState(false);
  const [parquetSmoking, setParquetSmoking] = useState(false);
  const [parquetFixedLength, setParquetFixedLength] = useState(false);
  const [selectedParquetGradeId, setSelectedParquetGradeId] = useState(null);

  const [parquetColoringVariants, setParquetColoringVariants] = useState(null);
  const [parquetColorTitle, setParquetColorTitle] = useState("");
  const [parquetColorLink, setParquetColorLink] = useState("");

  // NEW: parquet size (from product.parquetPrices[].size)
  const [selectedParquetSize, setSelectedParquetSize] = useState(null);

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("1");

  const { loading, error, data } = useQuery(GET_PRODUCT_ELEMENTS, {
    variables: {
      pagination: { limit: 50 },
      filters: { type: { eqi: "parquet" }, ...(brand ? { brand: { eqi: brand } } : {}) }
    }
  });

  const { data: productData, loading: loadingProduct, refetch: refetchProduct } = useQuery(GET_SUBORDER_PRODUCT, {
    variables: { filters: { suborder: { documentId: { eq: suborderId } }, type: { eq: "parquet" } } },
    skip: !suborderId,
    fetchPolicy: "network-only"
  });

  const [createSuborderProduct] = useMutation(CREATE_SUBORDER_PRODUCT, {
    onCompleted: () => { message.success(translations.dataSaved); setSaving(false); refetchProduct(); },
    onError: (err) => { message.error(`${translations.err}: ${err.message}`); setSaving(false); }
  });

  const [updateSuborderProduct] = useMutation(UPDATE_SUBORDER_PRODUCT, {
    onCompleted: () => { message.success(translations.dataSaved); setSaving(false); refetchProduct(); },
    onError: (err) => { message.error(`${translations.editError}: ${err.message}`); setSaving(false); }
  });

  const productElements = useMemo(() => data?.products?.filter(Boolean) || [], [data]);
  const filteredProducts = useMemo(() => {
    return (productElements || []).filter((p) => {
      if (!p) return false;
      const isModule = !!p.parquetModular;
      return (showNormal && !isModule) || (showModule && isModule);
    });
  }, [productElements, showNormal, showModule]);

  // init from existing
  useEffect(() => {
    if (!loadingProduct && productData && productElements.length > 0) {
      const sp = productData.suborderProducts?.[0];
      if (!sp) return;

      setSuborderProductId(sp.documentId);

      const newSizes = { height: 0, width: 0 };
      if (sp.sizes?.height != null) newSizes.height = sp.sizes.height;
      if (sp.sizes?.width != null) newSizes.width = sp.sizes.width;
      setSizes(newSizes);

      if (sp.product) {
        const found = productElements.find(p => p?.documentId === sp.product.documentId);
        if (found) setSelectedProduct(found);
      }

      setParquetLacquering(!!sp.parquetLacquering);
      setParquetOiling(!!sp.parquetOiling);
      setParquetBrushing(!!sp.parquetBrushing);
      setParquetSmoking(!!sp.parquetSmoking);
      setParquetFixedLength(!!sp.parquetFixedLength);

      if (sp.parquet_grade?.documentId) setSelectedParquetGradeId(sp.parquet_grade.documentId);

      setParquetColoringVariants(sp.parquetColoringVariants || null);
      setParquetColorTitle(sp.parquetColorTitle || "");
      setParquetColorLink(sp.parquetColorLink || "");

      setSelectedParquetSize(sp.parquetSize || null);
    }
  }, [productElements, productData, loadingProduct]);

  useEffect(() => {
    const area = parseFloat(((sizes.height * sizes.width) / 1_000_000).toFixed(2));
    setSquareMeters(area);
  }, [sizes.height, sizes.width]);

  const handleProductSelect = (product) => {
    if (!product) return;
    setSelectedProduct(product);
    setSelectedParquetGradeId(null);
    setSelectedParquetSize(null);
  };

  const handleSizeChange = (field, value) => setSizes(prev => ({ ...prev, [field]: value || 0 }));

  // Mutual exclusion: Lacquering vs Oiling
  const onToggleLacquering = (checked) => {
    setParquetLacquering(checked);
    if (checked) setParquetOiling(false);
  };
  const onToggleOiling = (checked) => {
    setParquetOiling(checked);
    if (checked) setParquetLacquering(false);
  };

  const handleSave = async () => {
    if (!suborderId) { message.error(translations.err); return; }
    if (!selectedProduct) { message.error(`${translations.choose} ${translations.parquet}`); return; }
    if (!sizes.height) { message.error(translations.enterHeight); return; }
    if (!sizes.width) { message.error(translations.enterWidth); return; }
    if (!selectedParquetGradeId) { message.error(translations.chooseParquetGrade); return; }
    if (!selectedParquetSize) { message.error(translations.chooseParquetSize); return; }
    if (!parquetColoringVariants) { message.error(translations.chooseColoringVariants); return; }
    if (parquetColoringVariants === 'standard' && !parquetColorTitle.trim()) { message.error(translations.writeColorTitle); return; }

    setSaving(true);
    try {
      const payload = {
        suborder: suborderId,
        product: selectedProduct.documentId,
        type: "parquet",
        sizes,
        parquetLacquering,
        parquetOiling,
        parquetBrushing,
        parquetSmoking,
        parquetFixedLength,
        parquet_grade: selectedParquetGradeId,
        parquetSize: selectedParquetSize,
        parquetColoringVariants,
        parquetColorTitle: parquetColorTitle.trim() || null,
        parquetColorLink: parquetColorLink.trim() || null
      };

      if (suborderProductId) {
        await updateSuborderProduct({ variables: { documentId: suborderProductId, data: payload } });
      } else {
        await createSuborderProduct({ variables: { data: payload } });
      }

      if (onAfterSubmit) await onAfterSubmit();
    } catch (err) {
      message.error(`${translations.err}: ${err.message}`);
      setSaving(false);
    }
  };

  if (loading || loadingProduct) return <Spin size="large" />;
  if (error) return <div>{translations.err}: {error.message}</div>;

  const items = [
    {
      key: "1",
      label: translations.parquet,
      children: (
        <Card>
          {/* Filters row: Normal / Module */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 12 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Checkbox checked={showNormal} onChange={e => setShowNormal(e.target.checked)} /> {translations.Normal}
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Checkbox checked={showModule} onChange={e => setShowModule(e.target.checked)} /> {translations.Module}
            </label>
          </div>

          <Row gutter={[16, 16]}>
            {filteredProducts.length === 0 ? (
              <Col span={24}><Empty description={translations.noData} /></Col>
            ) : (
              filteredProducts.map((product) => (
                !product ? null : (
                <Col span={6} key={product.documentId}>
                  <Card
                    hoverable={!(product?.archive)}
                    cover={
                      <div style={{ position: 'relative' }}>
                        {product.image?.url ? (
                          <img alt={product.title} src={`${baseUrl}${product.image.url}`} style={{ height: 200, objectFit: 'cover', width: '100%' }} />
                        ) : (
                          <div style={{ height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{translations.noImage}</div>
                        )}
                        {product?.archive && <ArchiveOverlay text={translations.notAvailable} />}
                      </div>
                    }
                    onClick={() => { if (!product?.archive) handleProductSelect(product); }}
                    style={{
                      border: selectedProduct?.documentId === product.documentId ? '2px solid #1890ff' : '1px solid #d9d9d9',
                      cursor: product?.archive ? 'not-allowed' : 'pointer',
                      position: 'relative'
                    }}
                  >
                    <Card.Meta title={translations[product.title] || product.title} />
                  </Card>
                </Col>)
              ))
            )}
          </Row>
        </Card>
      )
    },
    {
      key: "2",
      label: translations.sizes,
      disabled: !selectedProduct,
      children: (
        <Card>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Title level={5}>{translations.height}</Title>
              <InputNumber min={0} value={sizes.height} onChange={v => handleSizeChange('height', v)} style={{ width: '100%' }} addonAfter={'mm'} />
            </Col>
            <Col span={8}>
              <Title level={5}>{translations.width}</Title>
              <InputNumber min={0} value={sizes.width} onChange={v => handleSizeChange('width', v)} style={{ width: '100%' }} addonAfter={'mm'} />
            </Col>
            <Col span={8}>
              <Title level={5}>{translations.area}</Title>
              <InputNumber disabled value={squareMeters.toFixed(4)} style={{ width: '100%' }} addonAfter={'m²'} />
            </Col>
          </Row>
        </Card>
      )
    },
    {
      key: "3",
      label: translations.decor,
      disabled: !selectedProduct,
      children: (
        <Card>
          {/* Row 1: grade, size, variants, color title */}
          <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>{translations.parquet_grade}</Text>
              <Select
                value={selectedParquetGradeId || undefined}
                onChange={setSelectedParquetGradeId}
                style={{ width: '100%' }}
                placeholder={translations.choose}
                allowClear
              >
                {(selectedProduct?.parquetGrades || []).map(pg => (
                  <Option key={pg.documentId} value={pg.documentId}>{translations[pg.title] || pg.title}</Option>
                ))}
              </Select>
            </Col>
            <Col span={6}>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>{translations.parquetSize}</Text>
              <Select
                value={selectedParquetSize || undefined}
                onChange={setSelectedParquetSize}
                style={{ width: '100%' }}
                placeholder={translations.chooseParquetSize}
              >
                {(selectedProduct?.parquetPrices || []).map(pp => (
                  pp?.size ? <Option key={pp.size} value={pp.size}>{pp.size}</Option> : null
                ))}
              </Select>
            </Col>
            <Col span={6}>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>{translations.parquetColoringVariants}</Text>
              <Select
                value={parquetColoringVariants || undefined}
                onChange={(v) => setParquetColoringVariants(v)}
                style={{ width: '100%' }}
                placeholder={translations.chooseColoringVariants}
              >
                {COLORING_VARIANTS.map(v => (
                  <Option key={v} value={v}>{translations[v] || v}</Option>
                ))}
              </Select>
            </Col>
            <Col span={6}>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>{translations.parquetColorTitle}</Text>
              <Input
                value={parquetColorTitle}
                onChange={(e) => setParquetColorTitle(e.target.value)}
                disabled={parquetColoringVariants !== 'standard'}
              />
            </Col>
          </Row>

          {/* Row 2: color link */}
          <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>{translations.parquetColorLink}</Text>
              <Input
                value={parquetColorLink}
                onChange={(e) => setParquetColorLink(e.target.value)}
                placeholder="https:/ ..."
              />
            </Col>
          </Row>

          {/* Row 3: checkboxes inline */}
          <Row gutter={[12, 12]}>
            <Col span={24}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Checkbox checked={parquetLacquering} onChange={e => onToggleLacquering(e.target.checked)} disabled={parquetOiling} />
                  {translations.parquetLacquering}
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Checkbox checked={parquetOiling} onChange={e => onToggleOiling(e.target.checked)} disabled={parquetLacquering} />
                  {translations.parquetOiling}
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Checkbox checked={parquetBrushing} onChange={e => setParquetBrushing(e.target.checked)} />
                  {translations.parquetBrushing}
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Checkbox checked={parquetSmoking} onChange={e => setParquetSmoking(e.target.checked)} />
                  {translations.parquetSmoking}
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Checkbox checked={parquetFixedLength} onChange={e => setParquetFixedLength(e.target.checked)} />
                  {translations.parquetFixedLength}
                </label>
              </div>
            </Col>
          </Row>
        </Card>
      )
    }
  ];

  return (
    <div>
      <Divider orientation="left">{translations.selection} {translations.parquet}</Divider>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'right', alignItems: 'center' }}>
        <Button
          type="primary"
          onClick={handleSave}
          loading={saving}
          disabled={!selectedProduct}
          style={{ ...{ marginRight: 8, marginTop: -60 }, ...(suborderProductId ? { backgroundColor: '#52C41A' } : {}) }}
        >
          {suborderProductId ? translations.update : translations.save}
        </Button>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
    </div>
  );
};

export default ParquetSelection;
