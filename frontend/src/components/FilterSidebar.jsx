import React, { useState, useEffect, useMemo } from 'react';

const FilterSidebar = ({ products, allCategories = [], allSubCategories = [], onFilterChange, hideCategories = false }) => {
    const [price, setPrice] = useState({ min: '', max: '' });
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedSubCategories, setSelectedSubCategories] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [selectedColors, setSelectedColors] = useState([]);

    const { categories, subCategories, tags, brands, colors } = useMemo(() => {
        // If a full list of categories is provided, use it. Otherwise, derive from products.
        const cats = allCategories.length > 0 
            ? allCategories.map(c => c.name)
            : [...new Set(products.map(p => p.category?.name).filter(Boolean))];

        const subs = allSubCategories.length > 0
            ? allSubCategories.map(sc => sc.name)
            : [...new Set(products.flatMap(p => p.subCategory?.map(sc => sc.name)).filter(Boolean))];

        const allTags = [...new Set(products.flatMap(p => p.tags))];
        const allBrands = [...new Set(products.map(p => p.brand).filter(Boolean))];
        const allColors = [...new Set(products.map(p => p.color).filter(Boolean))];
        return { categories: cats, subCategories: subs, tags: allTags, brands: allBrands, colors: allColors };
    }, [products, allCategories, allSubCategories]);

    useEffect(() => {
        onFilterChange({
            price,
            tags: selectedTags,
            brands: selectedBrands,
            colors: selectedColors,
            categories: selectedCategories,
            subCategories: selectedSubCategories,
        });
    }, [price, selectedCategories, selectedSubCategories, selectedTags, selectedBrands, selectedColors, onFilterChange]);

    const handleCheckboxChange = (setter, value) => {
        setter(prev => prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]);
    };

    return (
        <>
            <div className="filter-group">
                <h3>Price Range</h3>
                <div className="price-inputs">
                    <input type="number" placeholder="Min" value={price.min} onChange={e => setPrice({ ...price, min: e.target.value })} />
                    <input type="number" placeholder="Max" value={price.max} onChange={e => setPrice({ ...price, max: e.target.value })} />
                </div>
            </div>

            {!hideCategories && categories.length > 0 && <div className="filter-group"><h3>Category</h3><div className="filter-options">{categories.map(c => <label key={c}><input type="checkbox" onChange={() => handleCheckboxChange(setSelectedCategories, c)} /> {c}</label>)}</div></div>}
            {!hideCategories && subCategories.length > 0 && <div className="filter-group"><h3>Sub-Category</h3><div className="filter-options">{subCategories.map(sc => <label key={sc}><input type="checkbox" onChange={() => handleCheckboxChange(setSelectedSubCategories, sc)} /> {sc}</label>)}</div></div>}
            {tags.length > 0 && <div className="filter-group"><h3>Tags</h3><div className="filter-options">{tags.map(t => <label key={t}><input type="checkbox" onChange={() => handleCheckboxChange(setSelectedTags, t)} /> {t}</label>)}</div></div>}
            {brands.length > 0 && <div className="filter-group"><h3>Brand</h3><div className="filter-options">{brands.map(b => <label key={b}><input type="checkbox" onChange={() => handleCheckboxChange(setSelectedBrands, b)} /> {b}</label>)}</div></div>}
            {colors.length > 0 && <div className="filter-group"><h3>Color</h3><div className="filter-options">{colors.map(c => <label key={c}><input type="checkbox" onChange={() => handleCheckboxChange(setSelectedColors, c)} /> {c}</label>)}</div></div>}
        </>
    );
};

export default FilterSidebar;
